<template>
  <q-scroll-area class="q-ma-md" ref="scrollAreaRef" style="height: 70vh">
    <q-input v-model="sessionKey"></q-input>
    <div class="row justify-center">
      <div style="width: 100%; max-width: 1000px">
        <q-chat-message class="chatItem" bg-color="grey-3">
          <Markdown source="您好，请问有什么能够帮助你呢？" />
        </q-chat-message>

        <q-chat-message
          v-for="chat in chats"
          :sent="chat.isSent"
          bg-color="grey-3"
        >
          <Markdown class="chatItem" :source="chat.text" />
        </q-chat-message>

        <q-chat-message v-if="isSpeeking" class="chatItem" bg-color="grey-3">
          <Markdown :source="SpeekingContent" />
        </q-chat-message>
        <q-chat-message v-if="isLoading" bg-color="white">
          <Markdown source="![loading](/spinner.gif)" />
        </q-chat-message>
      </div>
      <q-resize-observer @resize="onResize" />
    </div>
  </q-scroll-area>

  <!-- <q-card>
        <q-card-section style="height: 80%" class="scroll">
   
        </q-card-section>
      </q-card>
      -->
  <div class="q-pa-md justify-center">
    <q-input
      filled
      v-model="inputTxt"
      type="textarea"
      @keydown.enter.prevent="enterInput"
      :input-style="{ resize: 'none', height: '12vh', 'min-height': '80px' }"
    >
      <template v-slot:after>
        <q-btn round dense flat icon="send" @click="enterInput" />
      </template>
    </q-input>
  </div>
</template>

<script setup>
import Markdown from "vue3-markdown-it";
import { ref, reactive, watch } from "vue";

import { api } from "boot/axios";

const scrollAreaRef = ref(null);
const inputTxt = ref("");
const isLoading = ref(false);
const isSpeeking = ref(false);
const isFunctioning = ref(false);
const SpeekingContent = ref(false);
const sessionKey = ref("");
const chats = ref([]);

function postChat(msg) {
  isLoading.value = true;
  var data = {
    sessionKey: sessionKey.value,
    message: {
      role: "assistant",
      content: msg,
    },
  };

  fetch("http://localhost:5000/api/chat/stream", {
    method: "POST",
    // responseType: "arraybuffer",
    // responseType: "blob",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  }).then((response) => {
    console.log(response);
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    SpeekingContent.value = "";
    isLoading.value = false;
    isSpeeking.value = true;

    return new ReadableStream({
      start(controller) {
        function push() {
          reader.read().then(({ done, value }) => {
            if (done) {
              isSpeeking.value = false;
              chats.value.push({
                isSent: false,
                text: SpeekingContent.value,
              });
              SpeekingContent.value = "";

              controller.close();
              return;
            }
            var rawContent = decoder.decode(value);
            rawContent = "[" + rawContent.slice(0, -1) + "]";
            var jsContent = JSON.parse(rawContent);

            for (let i = 0; i < jsContent.length; i++) {
              sessionKey.value = jsContent[i].sessionKey;

              if (jsContent[i].type == "function") {
                isFunctioning.value = true;
                SpeekingContent.value = jsContent[i].content;
              } else {
                if(isFunctioning.value)
                {
                  isFunctioning.value=false;
                  SpeekingContent.value =''
                }
                SpeekingContent.value = SpeekingContent.value + jsContent[i].content;
              }
            }

            controller.enqueue(value);
            push();
          });
        }
        push();
      },
    });
  });

  // const response = api
  //   .post("/api/chat/stream", data, { responseType: "stream" })
  //   .then((response) => {
  //     response.data.on("data", (chunk) => {
  //       console.log("Data:", chunk.toString());
  //     });

  //     response.data.on("error", (err) => {
  //       console.error("Error:", err);
  //     });
  //   });

  // api.post("/api/chat", data).then((response) => {
  //     console.log(response)

  //   isLoading.value = false;
  //   chats.value.push({
  //     isSent: false,
  //     text: response.data,
  //   });

  //});
}

const onResize = () => {
  scrollAreaRef.value.setScrollPercentage("vertical", 1, 100);
};

const enterInput = () => {
  if (!inputTxt.value.trim()) {
    return;
  }
  chats.value.push({
    isSent: true,
    text: inputTxt.value,
  });
  postChat(inputTxt.value);
  inputTxt.value = "";

  //moveToNew();
};
</script>

<style>
.chatItem {
  max-width: 450px;
}

img {
  max-width: 300px;
}
</style>
