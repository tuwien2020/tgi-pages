import { watch, Ref, shallowRef } from "vue";
import { RouteLocationNormalized, Router } from "vue-router";

export function useUrlRef(router: Router, route: RouteLocationNormalized) {
  function urlRef(name: string, defaultValue: boolean): Ref<boolean>;
  function urlRef(name: string, defaultValue: string): Ref<string>;
  function urlRef(name: string, defaultValue: number): Ref<number>;
  function urlRef<T>(name: string, defaultValue: T): Ref<T> {
    // Parse the value in the URL
    const type = typeof defaultValue;
    let startingValue = undefined;
    const routeParamVal = route.query[name];
    if (type === "string") {
      if (routeParamVal !== undefined) {
        startingValue = routeParamVal + "";
      }
    } else if (type === "boolean") {
      const maybeBoolean = routeParamVal + "";
      if (maybeBoolean === "1" || maybeBoolean === "true") {
        startingValue = true;
      } else if (maybeBoolean === "0" || maybeBoolean === "false") {
        startingValue = false;
      }
    } else if (type === "number") {
      if (routeParamVal !== undefined && /^[0-9]+$/.test(routeParamVal + "")) {
        startingValue = Number.parseInt(routeParamVal + "", 10);
      }
    }
    // Create our ref
    const value: Ref<T> = shallowRef<T>(startingValue !== undefined ? (startingValue as any) : defaultValue);

    // If our ref changes, we update the URL
    watch(
      value,
      (v) => {
        const routerQuery = { ...route.query };
        routerQuery[name] = v + ""; // Serializing code, maybe this is good enough, not sure
        router.replace({ query: routerQuery });
      },
      { immediate: true }
    );

    return value;
  }

  return {
    urlRef,
  };
}
