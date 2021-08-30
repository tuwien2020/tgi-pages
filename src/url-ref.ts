import { watch, Ref, shallowRef } from "vue";
import { RouteLocationNormalized, Router } from "vue-router";

export function useUrlRef(router: Router, route: RouteLocationNormalized) {
  // We'll only support the types that we actually need
  function urlRef<T extends string| boolean = string>(name: string, defaultValue: T): Ref<T> {
    // Parse the value in the URL
    const type = typeof defaultValue;
    let startingValue = undefined;
    if (type === "string") {
      startingValue = route.query[name] + "";
    } else if (type === "boolean") {
      const maybeBoolean = route.query[name] + "";
      if (maybeBoolean === "0" || maybeBoolean === "false") {
        startingValue = false;
      } else if (maybeBoolean === "1" || maybeBoolean === "true") {
        startingValue = true;
      }
    }
    // Create our ref
    const value: Ref<T> = shallowRef<T>(startingValue !== undefined ? (startingValue as any) : defaultValue);

    // If our ref changes, we update the URL
    watch(value, (v) => {
      const routerQuery = { ...route.query };
      routerQuery[name] = v + ""; // Serializing code, maybe this is good enough, not sure
      router.replace({ query: routerQuery });
    }, {immediate: true});

    return value;
  }

  return {
    urlRef,
  };
}