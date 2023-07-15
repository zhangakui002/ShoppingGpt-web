<template>
  <div class="q-pa-lg">
    <q-form @submit="onSubmit" class="q-gutter-md">
      <div class="row justify-center">
        <q-file
          class="col-8"
          color="purple-12"
          v-model="file"
          name="file"
          label="请上传excel文件"
          accept=".xls,.xlsx"
          clearable
        >
          <template v-slot:prepend>
            <q-icon name="attach_file" />
          </template>
        </q-file>
      </div>

      <div class="row justify-center">
        <q-input
          class="col-8"
          name="OriginPrompt"
          v-model="inputTxt"
          label="请输入你的需求"
          filled
          type="textarea"
          :input-style="{ resize: 'none' }"
        />
      </div>
      <div class="row justify-center">
        <div>
          <q-btn label="提交" type="submit" color="primary" />
        </div>
      </div>
    </q-form>
  </div>
  <!-- <q-card>
        <q-card-section style="height: 80%" class="scroll">
   
        </q-card-section>
      </q-card>
      -->
</template>

<script setup>
import { ref, reactive, watch } from "vue";

import { api } from "boot/axios";

const inputTxt = ref("");
const file = ref(null);
const isFunctioning = ref(false);
const SpeekingContent = ref(false);

const onSubmit = (evt) => {
  const formData = new FormData(evt.target);

  const data = [];

  for (const [name, value] of formData.entries()) {
    data.push({
      name,
      value: value.name,
    });
  }

  console.log(formData)
  api.post("/api/ai_excel", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
       
      },
      responseType: 'blob'
    })
    .then(response => {
      // 获取响应中的文件数据
      const fileData = response.data;
      //const filename = getFilenameFromResponse(response);
      const url = window.URL.createObjectURL(new Blob([fileData]));

      // 创建一个下载链接
      const link = document.createElement('a');
      link.href = url;

      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(response.headers['content-disposition']);
      const filename = matches[1] || 'unknown';
      // 设置下载链接的属性
      link.setAttribute('download',filename); // 替换为实际的文件名及扩展名
      document.body.appendChild(link);

      // 触发下载
      link.click();

      // 清理资源
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    })
    .catch(error => {
      alert(error);
    });
};


function getFilenameFromResponse(response) {
  const disposition = response.headers['content-disposition'];
  const match = disposition.match(/filename="(.*)"/);
  if (match && match[1]) {
    return match[1];
  }
  return 'file';
}

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

<style></style>
