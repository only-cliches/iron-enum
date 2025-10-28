<script setup lang="ts">
import { IronEnum } from "iron-enum";
import { createEnumMatch } from "./mod";
import { ref } from "vue";

const Status = IronEnum<{
  Loading: undefined;
  Ready: { finishedAt: Date };
  Error: { message: string; code: number };
}>();

const EnumMatch = createEnumMatch(Status);

const statusValue = ref(Status.Loading());

</script>

<template>
  <EnumMatch :of="statusValue">
    <template #Loading>
      <div>Loading</div>
    </template>

    <template #Ready="{ finishedAt }">
      <div>Done at {{ finishedAt.toLocaleTimeString() }}</div>
    </template>

    <template #Error="{ message, code }">
      <div>Failed: {{ message }} ({{ code }})</div>
    </template>

    <!-- Optional fallback for any unhandled tag -->
    <template #_="{ tag, data }">
      <div>Unknown: {{ tag }}</div>
    </template>
  </EnumMatch>
</template>