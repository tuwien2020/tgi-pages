export interface Group<K, V> {
  key: K;
  values: V[];
}

export function groupBy<K, V>(list:V[], keySelector:(x:V)=>K, comparator:(a:K, b:K)=>number): Group<K,V>[] {
  const result: Group<K,V>[] = [];
  let group: Group<K,V> | null = null;
  list.sort((a,b) => comparator(keySelector(a),keySelector(b))).forEach(val => {
    let currKey = keySelector(val);
    if(group === null || comparator(group.key, currKey) != 0) {
      if(group != null) {
        result.push(group);
      }
      group = {
        key: currKey,
        values: [val]
      }
    }
    else {
      group.values.push(val);
    }
  });
  if(group != null) {
    result.push(group as Group<K,V>);
  }
  return result;
}