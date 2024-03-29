<script setup lang="ts">
import { useUrlRef } from "../../url-ref";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { reactive, ref, watch, computed, watchEffect } from "vue";
import { assertUnreachable } from "../../assert";
import * as Notify from "../../notify";
import { useMonaco } from "../../monaco/use-monaco";

const { t } = useI18n();

const pageName = "page.intervalScheduling.";
const router = useRouter();
const route = useRoute();
const { urlRef } = useUrlRef(router, route);

// TODO: refactor to enums (they now work well with TS 5.0)
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
  readonly id: number;
  readonly startTime: number;
  readonly endTime: number;
  color: string;
}

const parsedIntervals = computed(() => parseIntervals(enteredIntervals.value));
const intervals = reactive<Interval[]>([]);
const intervalElements = ref([] as HTMLElement[]);
const enteredIntervals = ref("");
const isEnteredIntervalsValid = ref(true);
const isGreedyRunning = ref(false);

function generateIntervals(count: number) {
  Notify.clear();
  enteredIntervals.value = "";

  const numDecimals = 0;

  for (let i = 0; i < count; i++) {
    const startTime = Math.random() * 90;
    let intervalLength = Math.random() * 40 + 10;
    const endTime = Math.min(100, startTime + intervalLength);
    intervalLength = endTime - startTime;

    enteredIntervals.value += `${startTime.toFixed(numDecimals)},${intervalLength.toFixed(numDecimals)}\n`;
  }

  sortingMethod.value = "";
  updateSorting();
}

function parseIntervals(enteredIntervals: string): Interval[] {
  const parsed: Interval[] = [];
  isEnteredIntervalsValid.value = true;

  const lines = enteredIntervals.trim().split("\n");
  lines.forEach((line, i) => {
    const legalChars = "0123456789., ";
    if (line.split("").some((char) => !legalChars.includes(char))) {
      isEnteredIntervalsValid.value = false;
      console.log("illegal line (invalid characters): " + line);
      return [];
    }

    const [startTime, duration] = line.split(",").map((v) => parseFloat(v.trim()));
    const endTime = startTime + duration;
    if (isNaN(startTime) || isNaN(duration) || startTime < 0 || duration < 0 || endTime > 100) {
      isEnteredIntervalsValid.value = false;
      console.log("illegal line (valid characters, wrong values): " + line);
      return [];
    }

    parsed.push({
      startTime: startTime,
      endTime: endTime,
      color: "white",
      id: i,
    });
  });

  return parsed;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startGreedy() {
  isGreedyRunning.value = true;
  const sortingMethodName = sortingMethod.value ? t(pageName + sortingMethod.value) : t(pageName + "unsorted");

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

  Notify.log("Done", `It was possible to finish ${solution.length} jobs using ${sortingMethodName}!`);
  isGreedyRunning.value = false;
}

watch(sortingMethod, (value) => {
  updateSorting();
  intervals.forEach((interval) => {
    interval.color = "white";
  });
});

watch(
  parsedIntervals,
  (value) => {
    intervals.length = 0;
    parsedIntervals.value.forEach((interval) => {
      intervals.push({ ...interval });
    });
  },
  {
    immediate: true,
  }
);

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
      intervals.sort((a, b) => compareAscending(a.endTime, b.endTime));
    } else if (sortingMethod === "earliestStartTime") {
      intervals.sort((a, b) => compareAscending(a.startTime, b.startTime));
    } else if (sortingMethod === "smallestInterval") {
      intervals.sort((a, b) => compareAscending(a.endTime - a.startTime, b.endTime - b.startTime));
    } else if (sortingMethod === "leastConflicts") {
      // Probably not as efficient as it could be.
      const overlapCount: number[] = new Array(intervals.length).fill(0);

      // Sort intervals by their start time and then count the overlaps.
      const intervalsCopy = intervals.slice();
      intervalsCopy.sort((a, b) => compareAscending(a.startTime, b.startTime));
      intervalsCopy.forEach((interval, index) => {
        index += 1;
        while (index < intervalsCopy.length && interval.endTime > intervalsCopy[index].startTime) {
          overlapCount[interval.id] += 1;
          overlapCount[intervalsCopy[index].id] += 1;
          index += 1;
        }
      });

      intervals.sort((a, b) => compareAscending(overlapCount[a.id], overlapCount[b.id]));
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
          {{ t(pageName + key) }}
        </option>
      </select>
    </label>
  </div>
  <br />
  <details>
    <summary>Insert your own schedule</summary>
    <span> Your current input is {{ isEnteredIntervalsValid ? "valid ✅" : "invalid ⚠️" }} </span>
    <br />
    <textarea rows="4" cols="50" v-model="enteredIntervals" class="is-family-monospace"></textarea>
  </details>
  <br />
  <span> ({{ (intervalSortingMethods as any)[sortingMethod]?.isCorrect ? t(pageName + "correct") : t(pageName + "incorrect") }}) </span>
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
  <br /><br />
  <div class="credits">Credits to: Stefan, Philippe, Yahya</div>
</template>

<style scoped>
.credits {
  font-size: 0.5em;
}
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
