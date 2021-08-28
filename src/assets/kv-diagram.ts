export class KVDiagram {
  constructor(public values: string[]) {}
}

export class KVBlock {
  constructor(public positions: number[]) {}
}

export function findBlocksInKVDiagram(diagram: KVDiagram): Array<KVBlock> {
  const blocks = new Array<KVBlock>();

  const values = diagram.values;
  const width = 4;
  const height = 4;

  // find horizontal 8 block
  for (let col = 0; col < 4; col++) {
    let positions = [
      getWrappedPosition(col, 0, 0, width, height),
      getWrappedPosition(col, 0, 1, width, height),
      getWrappedPosition(col, 1, 0, width, height),
      getWrappedPosition(col, 1, 1, width, height),

      getWrappedPosition(col, 2, 0, width, height),
      getWrappedPosition(col, 2, 1, width, height),
      getWrappedPosition(col, 3, 0, width, height),
      getWrappedPosition(col, 3, 1, width, height),
    ];

    if (positions.every((position) => values[position] == "1" || values[position] == "X")) {
      blocks.push(new KVBlock(positions));
    }
  }

  // find 2x2 squares
  for (let cell = 0; cell < 16; cell++) {
    let positions = [
      getWrappedPosition(cell, 0, 0, width, height),
      getWrappedPosition(cell, 0, 1, width, height),
      getWrappedPosition(cell, 1, 0, width, height),
      getWrappedPosition(cell, 1, 1, width, height),
    ];

    if (positions.every((position) => values[position] == "1" || values[position] == "X")) {
      blocks.push(new KVBlock(positions));
    }
  }

  // find 4x1 vertical lines
  for (let row = 0; row < 4; row++) {
    let positions = [
      getWrappedPosition(row * 4, 0, 0, width, height),
      getWrappedPosition(row * 4, 0, 1, width, height),
      getWrappedPosition(row * 4, 0, 2, width, height),
      getWrappedPosition(row * 4, 0, 3, width, height),
    ];

    if (positions.every((position) => values[position] == "1" || values[position] == "X")) {
      blocks.push(new KVBlock(positions));
    }
  }

  // find 4x1 horizontal lines
  for (let col = 0; col < 4; col++) {
    let positions = [
      getWrappedPosition(col, 0, 0, width, height),
      getWrappedPosition(col, 1, 0, width, height),
      getWrappedPosition(col, 2, 0, width, height),
      getWrappedPosition(col, 3, 0, width, height),
    ];

    if (positions.every((position) => values[position] == "1" || values[position] == "X")) {
      blocks.push(new KVBlock(positions));
    }
  }

  // find 2x1 vertical pairs
  for (let cell = 0; cell < 16; cell++) {
    let positions = [getWrappedPosition(cell, 0, 0, width, height), getWrappedPosition(cell, 0, 1, width, height)];

    if (positions.every((position) => values[position] == "1" || values[position] == "X")) {
      blocks.push(new KVBlock(positions));
    }
  }

  // find 2x1 horizontal pairs
  for (let cell = 0; cell < 16; cell++) {
    let positions = [getWrappedPosition(cell, 0, 0, width, height), getWrappedPosition(cell, 1, 0, width, height)];

    if (positions.every((position) => values[position] == "1" || values[position] == "X")) {
      blocks.push(new KVBlock(positions));
    }
  }

  // find single cells
  for (let cell = 0; cell < 16; cell++) {
    let positions = [getWrappedPosition(cell, 0, 0, width, height)];

    if (positions.every((position) => values[position] == "1" || values[position] == "X")) {
      blocks.push(new KVBlock(positions));
    }
  }

  return reduce(blocks);
}

function reduce(blocks: Array<KVBlock>) {
  let copy = blocks.slice();

  copy.sort((a, b) => a.positions.length - b.positions.length); // sorted by block size

  let filter = copy.filter(
    (block, index) =>
      !block.positions.every((position) => {
        // check for proper subset
        for (let i = index + 1; i < copy.length; i++) {
          for (let j = 0; j < copy[i].positions.length; j++) {
            if (copy[i].positions[j] == position) {
              return true;
            }
          }
        }
        return false;
      })
  );

  return filter;
}

function getWrappedPosition(index: number, rowShift: number, colShift: number, numRows: number, numCols: number) {
  let x = index % numCols;
  let y = Math.floor(index / numCols);

  x = (x + colShift + numCols) % numCols;
  y = (y + rowShift + numRows) % numRows;

  return x * numCols + y;
}
