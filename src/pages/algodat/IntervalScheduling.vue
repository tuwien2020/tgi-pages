<script setup lang="ts">
import { useUrlRef } from "../../url-ref";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { reactive, ref, watch } from "vue";
import { assertUnreachable } from "../../assert";
import * as Notify from "../../notify";

const { t } = useI18n();

const pageName = "page.intervalScheduling.";
const router = useRouter();
const route = useRoute();
const { urlRef } = useUrlRef(router, route);

const intervalSortingMethods = {
  earliestEndTime: {
    isCorrect: true,
  },
  earliestStartTime: {
    isCorrect: false,
  },
  smallestInterval: {
    isCorrect: false,
  },
  leastConflicts: {
    isCorrect: false,
  },
};

const numberOfIntervals = urlRef("numberOfIntervals", 5);
const sortingMethod = urlRef("sortingMethod", "");

interface Interval {
  id: number;
  startTime: number;
  endTime: number;
  color: string;
}

const intervals = reactive([] as Interval[]);
const intervalElements = ref([] as HTMLElement[]);
const isGreedyRunning = ref(false);

function generateIntervals(count: number) {
  intervals.length = 0;
  for (let i = 0; i < count; i++) {
    const startTime = Math.random() * 90;
    const intervalLength = startTime + Math.random() * 40 + 10;
    const endTime = Math.min(intervalLength, 100);
    intervals.push({
      startTime: startTime,
      endTime: endTime,
      color: "white",
      id: i,
    });
  }

  sortingMethod.value = "";
  updateSorting();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startGreedy() {
  isGreedyRunning.value = true;

  //performs the greedy algorithm
  const solution: Interval[] = [];
  let time = 0;
  for (let i = 0; i < intervals.length; i++) {
    if (time <= intervals[i].startTime) {
      solution.push(intervals[i]);
      intervals[i].color = "var(--first-color)";
      intervalElements.value[intervals[i].id]?.scrollIntoView({ block: "center", behavior: "smooth" });
      time = intervals[i].endTime;
    }
    await sleep(10);
  }

  Notify.log("Done", `It was possible to finish ${solution.length} jobs!`);
  isGreedyRunning.value = false;
}

watch(sortingMethod, (value) => {
  updateSorting();
  intervals.forEach((interval) => {
    interval.color = "white";
  });
});

function updateSorting() {
  function compareAscending(a: number, b: number) {
    return a - b;
  }

  function resetSorting() {
    intervals.sort((job1, job2) => compareAscending(job1.id, job2.id));
  }

  function sortJobs(sortingMethod: keyof typeof intervalSortingMethods) {
    if (!(sortingMethod in intervalSortingMethods)) {
      console.error("Invalid sorting method: " + sortingMethod);
      return;
    }

    if (sortingMethod === "earliestEndTime") {
      intervals.sort((job1, job2) => compareAscending(job1.endTime, job2.endTime));
    } else if (sortingMethod === "earliestStartTime") {
      intervals.sort((job1, job2) => compareAscending(job1.startTime, job2.startTime));
    } else if (sortingMethod === "smallestInterval") {
      intervals.sort((job1, job2) => compareAscending(job1.endTime - job1.startTime, job2.endTime - job2.startTime));
    } else if (sortingMethod === "leastConflicts") {
      Notify.warn("Not implemented", "Least conflicts sorting is not implemented");
      // TODO: Implement
    } else {
      assertUnreachable(sortingMethod);
    }
  }

  const sorting = sortingMethod.value;

  if (sorting in intervalSortingMethods) {
    sortJobs(sorting as keyof typeof intervalSortingMethods);
  } else {
    resetSorting();
  }
}
</script>

<template>
  <h1>{{ t("page.intervalScheduling.title") }}</h1>
  <div>
    <label>
      Number of intervals
      <input type="number" v-model="numberOfIntervals" min="0" step="1" :disabled="isGreedyRunning" />
    </label>
    <button @click="generateIntervals(numberOfIntervals)" :disabled="isGreedyRunning">Generate</button>
  </div>
  <br />
  <div>
    <label>
      Sorting method
      <select v-model="sortingMethod" :disabled="isGreedyRunning || intervals.length == 0">
        <option value="">{{ t(pageName + "unsorted") }}</option>
        <option v-for="(value, key) in intervalSortingMethods" :key="key" :value="key">
          {{ t(pageName + key) }} ({{ value.isCorrect ? t(pageName + "correct") : t(pageName + "incorrect") }})
        </option>
      </select>
    </label>
  </div>
  <br />
  <button @click="startGreedy()" :disabled="isGreedyRunning">Start Greedy</button>
  <br />
  <br />
  <div v-if="intervals.length == 0">Generate intervals please</div>
  <div class="graph" v-else>
    <!--TODO: https://vuejs.org/guide/built-ins/transition-group.html -->
    <div
      v-for="interval of intervals"
      :key="interval.id"
      ref="intervalElements"
      class="interval"
      :style="{
        'background-color': interval.color,
        left: interval.startTime + '%',
        width: interval.endTime - interval.startTime + '%',
      }"
    >
      <span v-once>{{ t(pageName + "interval") }}</span> {{ interval.id }}
    </div>
    <div class="graph-line-horizontal"></div>
    Time
    <div class="graph-background">
      <div
        v-for="i in 9"
        :key="i"
        class="graph-line-vertical"
        :style="{
          left: i * 10 + '%',
          top: '0',
          height: '100%',
          opacity: '0.5',
        }"
      ></div>
      <div
        v-for="i in 9"
        :key="i"
        class="graph-bottom-number"
        :style="{
          left: i * 10 + '%',
          bottom: '0',
        }"
      >
        {{ i * 10 }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.graph {
  position: relative;
  z-index: 1;
}
.graph-line-horizontal {
  border: 1px solid black;
}
.graph-line-vertical {
  border: 1px solid black;
  position: absolute;
}
.graph-bottom-number {
  position: absolute;
  /*transform: translateX(-50%);*/
  margin-left: 0.5rem;
}
.graph-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}
.graph .interval {
  position: relative;
  background-color: white;
  border: 1px solid black;
  border-radius: 0%;
  text-align: center;
  margin-bottom: 0.5em;
}
</style>
