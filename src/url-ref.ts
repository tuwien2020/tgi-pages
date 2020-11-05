import { ref, watch, Ref } from "vue";
import { RouteLocationNormalized, Router } from "vue-router";

export function useUrlRef(router: Router, route: RouteLocationNormalized) {
  function urlRef(name: string, defaultValue: string): Ref<string> {
    const value = ref<string>("" + (route.query[name] ?? defaultValue));

    watch(value, (v) => {
      const routerQuery = { ...route.query };
      routerQuery[name] = v;
      router.replace({ query: routerQuery });
    });

    return value;
  }

  return {
    urlRef,
  };
}
