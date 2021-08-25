export interface Group<T> {
  key: String;
  values: T[];
}

export function groupBy<T>(list:T[], keySelector:(x:T)=>string): Group<T>[] {
  const result: Group<T>[] = [];
  let group: Group<T> | null = null;
  list.sort((a,b) => keySelector(a).localeCompare(keySelector(b))).forEach(val => {
    let groupName = keySelector(val);
    if(group === null || group.key.localeCompare(groupName) != 0) {
      if(group != null) {
        result.push(group);
      }
      group = {
        key: groupName,
        values: [val]
      }
    }
    else {
      group.values.push(val);
    }
  });
  result.push(group as Group<T>);
  return result;
}