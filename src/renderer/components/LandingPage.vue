<template>
  <div id="wrapper">
    <div class="close" @click="closeWindow">
      <Icon class="btnClose" size="20" type="md-close" />
    </div>
    <div class="min" @click="minWindow">
      <Icon class="btnMin" size="20" type="md-remove" />
    </div>
    <div
      class="collect"
      @click="showCollectNovel"
      @mouseover="btnCollectMO"
      @mouseout="btnCollectML"
    >
      <Icon
        type="md-heart-outline"
        :size="collectIconSize"
        :class="collectIconClass"
        class="collectIcon"
      />
    </div>
    <label id="title" class="title" style="-webkit-app-region: drag">Novel Reader</label>
    <main style="margin-top: 36px;">
      <div class="left-side">
        <!-- <Select v-model="webType" style="width: 200px">
          <Option value="enet" selected="selected">网易</Option>
        </Select>-->
      </div>
      <div class="searchQuery">
        <Input v-model="novelName" placeholder="Enter novel name..." style="width: 300px" />
        <Button @click="searchWangyi" class="btnSub">搜索</Button>
      </div>
      <div class="searchBox">
        <div
          v-for="(item, key) of novelList"
          class="novelItem"
          :key="key"
          @click="showNovelDetail(item.nid, item.fullTitle, item.author, item.src, item.title)"
        >
          <img :src="item.src" style="width: 120px;height:160px;" />
          <p>{{item.title}}</p>
          <p>{{item.author}}</p>
        </div>
      </div>
    </main>
    <Modal
      :title="modalNovelDetailTitle"
      v-model="modalNovelDetail"
      class-name="vertical-center-modal"
    >
      <div>
        <div class="catalogList">
          <p
            :style="item.leaf?'font-size:14px;cursor:pointer;':'font-weight:bold;font-size:16px;margin-top:5px;'"
            v-for="(item, key) of novelTitles"
            :key="key"
            @click="readNovel(item.title, item.nid, item.secId, item.leaf, item.needPay)"
          >
            <span>{{item.title}}{{item.needPay?"(收费)":""}}</span>
            <span style="float: right;margin-right:15px;">{{item.publishTime}}</span>
          </p>
        </div>
      </div>
      <div slot="footer">
        <Icon
          :type="isCollect?'md-heart':'md-heart-outline'"
          size="25"
          color="#e53935"
          style="cursor: pointer;"
          @click="collectNovel()"
        />
      </div>
    </Modal>
    <Drawer
      title="收藏"
      :closable="true"
      v-model="isShowCollectNovel"
      width="100"
      style="z-index: 9902"
    >
      <div
        v-for="(item, key) of novelCollectedList"
        class="novelItem"
        :key="key"
        @click="showNovelDetail(item.nid, item.fullTitle, item.author, item.src, item.title)"
      >
        <img :src="item.src" style="width: 120px;height:160px;" />
        <p>{{item.title}}</p>
        <p>{{item.author}}</p>
      </div>
    </Drawer>
    <Drawer
      style="z-index: 9901"
      :title="novelChapter"
      :closable="true"
      v-model="isShowNovelContent"
      width="100"
      @on-close="closeNovelContent"
      placement="left"
    >
      <div style="text-indent:25px;">
        <p style="margin-bottom: 5px;" v-for="(item, key) of novelContentRows" :key="key">{{item}}</p>
      </div>
    </Drawer>
  </div>
</template>
<script>
import SystemInformation from "./LandingPage/SystemInformation";
import { dec } from "../../main/reader-debug.js";
import { setInterval, clearInterval } from "timers";
const axios = require("axios");
var request = require("request");
var ipc = require("electron").ipcRenderer;
export default {
  data() {
    return {
      webType: "enet",
      novelChapter: "",
      isShowNovelContent: false,
      isShowCollectNovel: false,
      novelContentRows: [],
      novelName: "",
      novelTitle: "",
      novelTitles: [],
      timer: null,
      timerMap: new Map(),
      novelList: [],
      novelCollectedList: [],
      modalNovelDetail: false,
      modalNovelDetailTitle: "",
      novelItem: {},
      collectIconClass: "btnCollectIcon",
      collectIconSize: 17,
      isCollect: false
    };
  },
  name: "landing-page",
  components: { SystemInformation },
  created() {
    var name = localStorage.getItem("u");
    if (name != null) {
      this.novelName = name;
    }
    var c = localStorage.getItem("c");
    if (c != null) {
      this.novelCollectedList = eval("(" + c + ")");
    }
    this.checkNew();
  },
  methods: {
    checkNew() {
      var that = this;
      var task = function(nid) {
        var isExist = false;
        if (!that.novelCollectedList) {
          return;
        }
        for (var i = 0; i < that.novelCollectedList.length; i++) {
          if (that.novelCollectedList[i].nid == nid) {
            isExist = true;
            break;
          }
        }
        if (!isExist) {
          return;
        }
        request(
          {
            method: "post",
            url:
              "http://guofeng.yuedu.163.com/newBookReader.do?operation=info&sourceUuid=" +
              nid +
              "&catalogOnly=true",
            form: null,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            }
          },
          function(err, res, body) {
            if (err) {
              console.log(err);
            } else {
              var oldTitle = localStorage.getItem(nid + "LastTitle");
              var bodyJson = eval("(" + body + ")");
              if (bodyJson.resultCode == -1) {
                return;
              }
              var catalog = bodyJson.catalog;
              var lastTitle = catalog[catalog.length - 1].title;
              for (var i = 0; i < catalog.length; i++) {
                var lastCatalog = catalog[i];
              }
              if (oldTitle == null) {
                localStorage.setItem(nid + "LastTitle", lastTitle);
              } else if (oldTitle != lastTitle) {
                localStorage.setItem(nid + "LastTitle", lastTitle);
                alert("小说已更新，新的章节为：" + lastTitle);
              }
              setTimeout(task, 5000, nid);
            }
          }
        );
      };
      for (var i = 0; i < this.novelCollectedList.length; i++) {
        var nid = this.novelCollectedList[i].nid;
        setTimeout(task, 5000, nid);
      }
    },
    collectNovel() {
      if (this.isCollect) {
        for (var i = 0; i < this.novelCollectedList.length; i++) {
          if (this.novelCollectedList[i].nid == this.novelItem.nid) {
            this.novelCollectedList.splice(i, 1);
            break;
          }
        }
      } else {
        this.novelCollectedList.push(this.novelItem);
      }

      localStorage.setItem("c", JSON.stringify(this.novelCollectedList));
      this.isCollect = !this.isCollect;
      this.checkNew();
    },
    showCollectNovel() {
      this.isShowCollectNovel = true;
    },
    btnCollectMO() {
      this.collectIconClass = "btnCollectIconHover";
      this.collectIconSize = 22;
    },
    btnCollectML() {
      this.collectIconClass = "btnCollectIcon";
      this.collectIconSize = 17;
    },
    readNovel(novelChapter, nid, aid, leaf, needPay) {
      if (needPay) {
        alert("收费章节，请在手机端阅读");
      } else if (leaf) {
        this.modalNovelDetail = false;
        this.novelChapter = novelChapter;
        this.isShowNovelContent = true;
        this.novelContentRows = [];
        this.getNovelContent(nid, aid);
      }
    },
    closeNovelContent() {
      this.modalNovelDetail = true;
    },
    open(link) {
      this.$electron.shell.openExternal(link);
    },
    closeWindow() {
      ipc.send("window-close");
    },
    minWindow() {
      ipc.send("window-min");
    },
    showNovelDetail(nid, fullTitle, author, src, novelTitle) {
      this.novelTitles = [];
      // clearInterval(this.timer);
      this.modalNovelDetail = true;
      this.modalNovelDetailTitle = fullTitle;

      this.novelItem = {
        nid: nid,
        author: author,
        src: src,
        title: novelTitle,
        fullTitle: fullTitle
      };

      this.isCollect = false;
      for (var i = 0; i < this.novelCollectedList.length; i++) {
        if (this.novelCollectedList[i].nid == nid) {
          this.isCollect = true;
          break;
        }
      }
      this.getNovel(nid);
    },
    searchWangyi() {
      var novelName = this.novelName;
      localStorage.setItem("u", novelName);
      var url =
        "http://guofeng.yuedu.163.com/search.do?key=" +
        encodeURIComponent(novelName) +
        "&type=4&docType=html";
      var that = this;
      request(
        {
          method: "get",
          url: url,
          form: null,
          headers: {
            "Content-Type": "text/html;charset=UTF-8"
          }
        },
        function(err, res, body) {
          if (err) {
            console.log(err);
          } else {
            var html = eval("(" + body + ")").html.replace(
              new RegExp("> <", "gm"),
              "><"
            );
            var parser = new DOMParser();
            var htmlDoc = parser.parseFromString(html, "text/html");
            var lis = htmlDoc.getElementsByClassName("searchItem");
            if (lis == null || lis.length == 0) {
              alert("没有");
              return;
            } else {
              that.novelList = [];
              for (var i = 0; i < lis.length; i++) {
                var li = lis[i];
                var novelTitle = li.querySelector("h5").querySelector("a")
                  .innerHTML;
                var fullTitle = novelTitle;
                if (novelTitle.length > 9) {
                  novelTitle = novelTitle.substring(0, 9) + "...";
                }
                var author = li.getElementsByClassName("author")[0].innerHTML;
                if (author.length > 9) {
                  author = author.substring(0, 9) + "...";
                }
                var src = li.querySelector("img").getAttribute("src");
                var href = li
                  .getElementsByClassName("cover")[0]
                  .getAttribute("href");
                var nid = href.substring(href.indexOf("source") + 7);
                var novelItem = {
                  nid: nid,
                  author: author,
                  src: src,
                  title: novelTitle,
                  fullTitle: fullTitle
                };
                that.novelList.push(novelItem);
              }
            }
          }
        }
      );
    },
    getNovel(nid) {
      var options = {
        method: "post",
        url:
          "http://guofeng.yuedu.163.com/newBookReader.do?operation=info&sourceUuid=" +
          nid +
          "&catalogOnly=true",
        form: null,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      };

      var that = this;
      var ajax = function() {
        request(options, function(err, res, body) {
          if (err) {
            console.log(err);
          } else {
            that.novelTitles = [];
            var oldTitle = localStorage.getItem(nid + "LastTitle");
            var bodyJson = eval("(" + body + ")");
            if (bodyJson.resultCode == -1) {
              return;
            }
            var catalog = bodyJson.catalog;
            var lastTitle = catalog[catalog.length - 1].title;
            for (var i = 0; i < catalog.length; i++) {
              var lastCatalog = catalog[i];
              that.novelTitles.push({
                title: lastCatalog.title,
                publishTime: lastCatalog.publishTime,
                nid: nid,
                secId: lastCatalog.secId,
                leaf: lastCatalog.leaf,
                needPay: lastCatalog.needPay
              });
            }
            if (oldTitle == null) {
              localStorage.setItem(nid + "LastTitle", lastTitle);
            } else if (oldTitle != lastTitle) {
              localStorage.setItem(nid + "LastTitle", lastTitle);
              alert("小说已更新，新的章节为：" + lastTitle);
            }
          }
        });
      };
      ajax();
    },
    getNovelContent(nid, aid) {
      var options = {
        method: "post",
        url:
          "http://guofeng.yuedu.163.com/getArticleContent.do?sourceUuid=" +
          nid +
          "&articleUuid=" +
          aid,
        form: null,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      };
      var that = this;
      request(options, function(err, res, body) {
        if (err) {
          console.log(err);
        } else {
          var content = eval("(" + body + ")").content;
          var novelContent = dec(content);
          var parser = new DOMParser();
          var htmlDoc = parser.parseFromString(novelContent, "text/html");
          var lis = htmlDoc.querySelectorAll("p");
          for (var i = 0; i < lis.length; i++) {
            that.novelContentRows.push(lis[i].innerHTML);
          }
        }
      });
    }
  }
};
</script>

<style>
@import url("https://fonts.googleapis.com/css?family=Source+Sans+Pro");
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.vertical-center-modal {
  align-items: center;
  justify-content: center;
}

.novelItem {
  margin: 10px 10px;
  padding: 15px 15px;
  box-shadow: 2px 2px 8px grey;
  display: inline-block;
  width: 150px;
  height: 230px;
  transition: 0.2s;
  cursor: pointer;
}
.novelItem:hover {
  box-shadow: 0 0 10px grey;
}

.btnSub {
  margin-left: 10px;
}

.searchQuery {
  margin-left: 10px;
}

.txtSearch {
  height: 30px;
}

.searchBox {
  margin-top: 10px;
  width: 100%;
  height: 400px;
  overflow-y: auto;
}

.close {
  position: fixed;
  right: 5px;
  top: 5px;
  cursor: pointer;
}

.min {
  position: fixed;
  right: 30px;
  top: 5px;
  cursor: pointer;
}

.collectIcon {
  position: fixed;
  right: 55px;
  top: 5px;
  cursor: pointer;
}

.btnCollectIcon {
  top: 7px;
  right: 57px;
}

.btnCollectIconHover {
  top: 4px;
  right: 55px;
}

.btnClose {
  transition: 0.3s;
}

.btnMin {
  transition: 0.3s;
}

.btnClose:hover {
  transform: rotate(90deg);
}

.btnMin:hover {
  transform: rotate(180deg);
}

body {
  font-family: "Source Sans Pro", sans-serif;
}

#wrapper {
  background: radial-gradient(
    ellipse at top left,
    rgba(255, 255, 255, 1) 40%,
    rgba(229, 229, 229, 0.9) 100%
  );
  height: 100vh;
  padding: 60px 80px;
  width: 100vw;
}

#logo {
  height: auto;
  margin-bottom: 20px;
  width: 420px;
}

main {
  display: flex;
  justify-content: space-between;
}

main > div {
  flex-basis: 50%;
}

.left-side {
  display: flex;
  flex-direction: column;
}

.welcome {
  color: #555;
  font-size: 23px;
  margin-bottom: 10px;
}

.catalogList {
  height: 200px;
  overflow: auto;
  padding: 5px 15px;
}

.title {
  width: 90%;
  font-weight: bold;
  color: #2c3e50;
  font-size: 15px;
  position: fixed;
  left: 15px;
  top: 10px;
}

.title.alt {
  font-size: 18px;
  margin-bottom: 10px;
}
</style>
