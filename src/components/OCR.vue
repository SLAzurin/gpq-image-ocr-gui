<script setup lang="ts">
import { ref, watch } from "vue";
import { Codemirror } from "vue-codemirror";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import * as child_process from "node:child_process";
import * as path from "node:path";
import * as stream from "node:stream";

const members = ref<string[]>([]);
try {
  const storageMembers = localStorage.getItem("members");
  if (storageMembers) members.value = JSON.parse(storageMembers);
} catch (e: unknown) {
  // dont do anything, just leave it []
}

const missingMembers = ref<string[]>([]);
const resultsStr = ref("{\n\n}");
const resultsStrIsValid = ref(true);
const extensions = [json(), oneDark];

watch(resultsStr, async (newV) => {
  try {
    const o = JSON.parse(newV);
    resultsStrIsValid.value = true;
    const newMissingMembers: string[] = [];
    Object.keys(o).forEach((k) => {
      if (members.value.includes(k) === false) {
        newMissingMembers.push(k);
      }
    });
    missingMembers.value = newMissingMembers;
  } catch (e: unknown) {
    console.log("error new resultsStr not json");
    resultsStrIsValid.value = false;
  }
});

const statusStr = ref("");
const statusType = ref<"alert-success" | "alert-error" | "alert-warning" | "">(
  ""
);
const processing = ref(false);

const processVideo = async (videoPath: string) => {
  processing.value = true;
  console.log("spawning");

  const stdinStream = new stream.Readable();
  stdinStream.push(
    JSON.stringify({
      members: members.value,
    })
  ); // Add data to the internal queue for users of the stream to consume
  stdinStream.push(null); // Signals the end of the stream (EOF)

  const c = child_process.spawn(
    ".\\gpq.exe",
    ["--subprocess=true", "--video=" + videoPath],
    {
      cwd: process.cwd() + path.sep + "gpq",
      shell: "powershell",
    }
  );
  c.stdin.setDefaultEncoding("utf-8");
  stdinStream.pipe(c.stdin);
  let stdout = "";
  c.stdout.on("data", (data) => {
    stdout += data.toString("utf-8");
  });
  let stderr = "";
  c.stderr.on("data", (data) => {
    stderr += data;
  });
  c.on("exit", (exitCode) => {
    processing.value = false;
    if (exitCode === 0) {
      console.log(stdout);
      const o = JSON.parse(stdout);
      const o2 = JSON.parse(resultsStr.value);
      Object.entries<number>(o).forEach(([k, v]) => {
        o2[k] = v;
      });
      resultsStr.value = JSON.stringify(o2, null, 4);
    } else {
      console.log(stdout, stderr);
    }
  });
};

const processImages = async (base64image: string) => {
  processing.value = true;
  // const fName = localStorage.getItem("GPQ_TOOL_VERSION");
  const fName = "gpq";
  console.log("spawning");

  const stdinStream = new stream.Readable();
  stdinStream.push(
    JSON.stringify({
      members: members.value,
      base64image: `${base64image.substring(
        base64image.indexOf("base64,") + 7
      )}`,
    })
  ); // Add data to the internal queue for users of the stream to consume
  stdinStream.push(null); // Signals the end of the stream (EOF)

  const c = child_process.spawn(".\\gpq.exe", ["--subprocess=true"], {
    cwd: process.cwd() + path.sep + fName,
    shell: "powershell",
  });
  c.stdin.setDefaultEncoding("utf-8");
  stdinStream.pipe(c.stdin);
  let stdout = "";
  c.stdout.on("data", (data) => {
    stdout += data.toString("utf-8");
  });

  let stderr = "";
  c.stderr.on("data", (data) => {
    stderr += data;
  });

  c.on("exit", (exitCode) => {
    processing.value = false;
    if (exitCode === 0) {
      console.log(stdout);
      const o = JSON.parse(stdout);
      const o2 = JSON.parse(resultsStr.value);
      Object.entries<number>(o).forEach(([k, v]) => {
        o2[k] = v;
      });
      resultsStr.value = JSON.stringify(o2, null, 4);
    } else {
      console.log(stdout, stderr);
    }
  });
};

const pasteContent = (e: ClipboardEvent) => {
  if (!resultsStrIsValid.value) {
    return;
  }
  statusType.value = "";
  if (e.clipboardData?.items[0].type.startsWith("image/")) {
    const f = e.clipboardData?.items[0].getAsFile();
    if (f) {
      const r = new FileReader();
      r.readAsDataURL(f);
      r.onloadend = () => {
        const base64data = r.result;
        if (base64data) {
          processImages(base64data.toString());
        }
      };
    }
  } else if (e.clipboardData?.items[0].kind === "string") {
    e.clipboardData?.items[0].getAsString((v) => {
      try {
        const m: string[] = JSON.parse(v);
        members.value = m;
        localStorage.setItem("members", JSON.stringify(m));
        statusStr.value = `Successfully imported ${m.length} member(s)`;
        statusType.value = "alert-success";
      } catch (e: unknown) {
        statusStr.value = "Failed to update members list";
        statusType.value = "alert-error";
        console.log(e, v);
      }
    });
  } else if (e.clipboardData?.items[0].type === "video/mp4") {
    const f = e.clipboardData?.items[0].getAsFile();
    if (f) {
      console.log(f.path);
      processVideo(f.path);
    }
  }
};

const copyResultsToClipboard = () => {
  try {
    navigator.clipboard.writeText(resultsStr.value);
    statusStr.value = "Copied result to clipboard!";
    statusType.value = "alert-success";
  } catch (err) {
    alert("Failed to copy resultsStr to clipboard");
  }
};
</script>

<template>
  <div class="main-run">
    <h1 style="margin-bottom: 1em">Welcome to GPQ Image OCR</h1>
    <div class="horizontal">
      <div class="vertical">
        <h4>
          Credits:<br />UI & supporting logic dev:
          <span class="underline">AzurinDayo</span> (iMonoxian)<br />Main logic
          dev: <span class="underline">qbkl</span> (inuwater)
        </h4>
        <h4>
          Other Contributors:<br />Supporting logic dev:
          <span class="underline">YellowCello</span> (BlueFlute)
        </h4>
        <p></p>
        <textarea
          name="paste-images"
          id="paste-images"
          cols="40"
          rows="10"
          :placeholder="`Paste members and images here

${members.length} member(s)`"
          @paste="pasteContent"
          readonly
        ></textarea>
        <div v-if="processing">Working...</div>
        <div v-else></div>
      </div>
      <div class="center">
        <button
          @click="copyResultsToClipboard"
          className="btn btn-primary"
          :disabled="!resultsStrIsValid"
        >
          Copy results to clipboard
        </button>
        <div
          v-if="missingMembers.length > 0"
          className="alert alert-warning"
          role="alert"
        >
          Missing members: {{ missingMembers.join(", ") }}
        </div>
        <div
          v-if="!resultsStrIsValid"
          className="alert alert-error"
          role="alert"
        >
          JSON format syntax error!
        </div>
        <codemirror
          v-model="resultsStr"
          placeholder="Code goes here..."
          :style="{
            minHeight: '60vh',
            minWidth: '30vw',
            textAlign: 'left',
            fontSize: '1rem',
          }"
          :autofocus="true"
          :indent-with-tab="true"
          :tab-size="4"
          :extensions="extensions"
          @change="resultsStr = $event"
        />
      </div>
    </div>
  </div>
  <div
    v-if="statusType === 'alert-success'"
    role="alert"
    className="alert alert-success"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="stroke-current shrink-0 h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
    <span>{{ statusStr }}</span>
  </div>
  <div
    v-if="statusType === 'alert-error'"
    role="alert"
    className="alert alert-error"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="stroke-current shrink-0 h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
    <span>{{ statusStr }}</span>
  </div>
  <div
    v-if="statusType === 'alert-warning'"
    role="alert"
    className="alert alert-warning"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="stroke-current shrink-0 h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
    <span>{{ statusStr }}</span>
  </div>
</template>

<style scoped>
pre {
  display: block;
  white-space: pre-wrap;
  word-break: keep-all;
  text-align: left;
}

::placeholder {
  padding: 1rem;
}
.alert {
  margin-top: 1rem;
}
.center {
  margin: auto;
}
.horizontal {
  display: flex;
  flex-direction: row;
}
.underline {
  text-decoration: underline;
}
h4 {
  margin-bottom: 1em;
}

textarea {
  resize: none;
  border-radius: 1rem;
}
#paste-images::placeholder {
  font-size: 1.5rem;
}
.vertical {
  flex-direction: row;
}
.main-run {
  display: flex;
  flex-direction: column;
}
</style>
