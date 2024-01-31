<script setup lang="ts">
import { onMounted } from "vue";
import * as fs from "node:fs";
import * as path from "node:path";
import * as child_process from "node:child_process";
import axios from "axios";

const emit = defineEmits<{
  ready: [] | [string];
}>();

onMounted(() => {
  emit("ready", "Checking for gpq-image-ocr updates, might take a while...");
  (async () => {
    const gpqToolVersion = localStorage.getItem("GPQ_TOOL_VERSION");
    const gpqToolLastUpdated = new Date(
      localStorage.getItem("GPQ_TOOL_LAST_UPDATED") ?? ""
    );

    let needUpdate =
      gpqToolLastUpdated < new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
    if (!needUpdate)
      needUpdate = !(
        !!gpqToolVersion &&
        fs.existsSync(
          process.cwd() + path.sep + gpqToolVersion + path.sep + "gpq.exe"
        )
      );

    if (!needUpdate) return emit("ready");
    try {
      emit("ready", "Checking for gpq-image-ocr updates...");
      const latestRelease = await axios
        .get(
          "https://api.github.com/repos/SLAzurin/gpq-image-ocr/releases/latest"
        )
        .then((resp) => {
          return resp.data;
        });
      // const latestRelease = JSON.parse(
      //   fs.readFileSync(process.cwd() + path.sep + "ghreq.json").toString()
      // );
      const zipName = (
        latestRelease.assets[0].browser_download_url as string
      ).substring(
        (latestRelease.assets[0].browser_download_url as string).lastIndexOf(
          "/"
        ) + 1
      );
      const fName = zipName
        .substring(0, zipName.lastIndexOf("."))
        .replaceAll("-nightly", "");

      if (
        fName === gpqToolVersion &&
        fs.existsSync(process.cwd() + path.sep + fName + path.sep + "gpq.exe")
      ) {
        localStorage.setItem("GPQ_TOOL_LAST_UPDATED", new Date().toJSON());
        return emit("ready");
      }

      emit("ready", "Update found, downloading...");
      let { status, stderr } = child_process.spawnSync(
        "Invoke-WebRequest",
        [
          latestRelease.assets[0].browser_download_url as string,
          "-OutFile",
          ".\\" + zipName,
        ],
        {
          shell: "powershell",
          cwd: process.cwd(),
        }
      );
      if (status !== 0) throw new Error(stderr.toString());

      emit("ready", "Removing old gpq-image-ocr version...");
      if (fName && fs.existsSync(process.cwd() + path.sep + fName)) {
        ({ status, stderr } = child_process.spawnSync(
          "Remove-Item",
          ["-Recurse", "-Force", fName],
          {
            shell: "powershell",
            cwd: process.cwd(),
          }
        ));
        if (status !== 0) throw new Error(stderr.toString());
      }

      emit("ready", "Extracting new gpq-image-ocr version...");
      ({ status, stderr } = child_process.spawnSync(
        "Expand-Archive",
        [zipName, "-DestinationPath", ".\\"],
        {
          shell: "powershell",
          cwd: process.cwd(),
        }
      ));
      if (status !== 0) throw new Error(stderr.toString());

      emit("ready", "Finalizing gpq-image-ocr update...");
      ({ status, stderr } = child_process.spawnSync(
        "Remove-Item",
        ["-Recurse", "-Force", zipName],
        {
          shell: "powershell",
          cwd: process.cwd(),
        }
      ));
      if (status !== 0) throw new Error(stderr.toString());

      localStorage.setItem("GPQ_TOOL_VERSION", fName);
      localStorage.setItem("GPQ_TOOL_LAST_UPDATED", new Date().toJSON());
    } catch (e: any) {
      if (!gpqToolVersion) return emit("ready", e.toString());
      alert(
        "Failed to update the gpq-image-ocr tool, will retry next app restart. You may continue using this older version in the meantime."
      );
    }
    return emit("ready");
  })();
});
</script>

<template>
  <h1>Preparing GPQ Image OCR...</h1>
</template>

<style scoped></style>
