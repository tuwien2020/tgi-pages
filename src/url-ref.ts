import { watch, Ref, shallowRef, ShallowRef } from "vue";
import { RouteLocationNormalized, Router } from "vue-router";

type UrlRefValue =
  | {
      type: "boolean";
      value: ShallowRef<boolean>;
    }
  | {
      type: "string";
      value: ShallowRef<string>;
    }
  | {
      type: "number";
      value: ShallowRef<number>;
    };

export function useUrlRef(router: Router, route: RouteLocationNormalized) {
  const urlRefs = new Map<string, UrlRefValue>();
  let updateScheduled = false;

  function urlRef(name: string, defaultValue: boolean): Ref<boolean>;
  function urlRef(name: string, defaultValue: string): Ref<string>;
  function urlRef(name: string, defaultValue: number): Ref<number>;
  function urlRef<T>(name: string, defaultValue: T): Ref<T> {
    // Parse the value in the URL
    const type = typeof defaultValue as UrlRefValue["type"];
    const routeValue = route.query[name];
    const startingValue = parseValue(type, routeValue === null || routeValue === undefined ? undefined : routeValue + "");

    // Create our ref
    const value = shallowRef<T>(startingValue !== undefined ? (startingValue as any) : defaultValue);
    urlRefs.set(name, {
      type: type,
      value: value as ShallowRef<any>,
    });

    // If our ref changes, we update the URL
    watch(
      value,
      (v) => {
        if (!updateScheduled) {
          updateScheduled = true;
          setTimeout(async () => {
            updateScheduled = false;
            await updateUrl();
          }, 0);
        }
      },
      { immediate: true }
    );

    return value;
  }

  async function updateUrl() {
    const routerQuery = { ...route.query };
    urlRefs.forEach((value, key) => {
      routerQuery[key] = value.value.value + ""; // Serializing code, maybe this is good enough, not sure
    });
    await router.replace({ query: routerQuery });
  }

  function parseValue(type: UrlRefValue["type"], value: string | undefined): string | number | boolean | undefined {
    if (type === "string") {
      if (value !== undefined) {
        return value;
      }
    } else if (type === "boolean") {
      if (value === "1" || value === "true") {
        return true;
      } else if (value === "0" || value === "false") {
        return false;
      }
    } else if (type === "number") {
      if (value !== undefined && /^[0-9]+$/.test(value)) {
        return Number.parseFloat(value);
      }
    }

    return undefined;
  }

  return {
    urlRef,
  };
}
