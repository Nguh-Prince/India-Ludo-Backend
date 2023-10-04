export const getRandomInteger = (min = 1, max = 6, cheat = null) => {
  return cheat ? cheat : Math.floor(Math.random() * (max - min + 1)) + min;
};

export const defaultSequence = {
  green: {
    next: "red",
  },
  red: {
    next: "blue",
  },
  blue: {
    next: "yellow",
  },
  yellow: {
    next: "green",
  },
};

export const getListOfColorsFromSequence = (color, sequence) => {
  let listOfColors = [color];

  let nextColor = sequence[color].next;

  while (nextColor != color) {
    listOfColors.push(nextColor);

    nextColor = sequence[nextColor].next;
  }
  return listOfColors;
};

// get the row and column of a square in the game array from its ID
export const getSquareCoordinatesInGameArrayFromID = (squareId) => {
  // the squareId is a 3-digit string where the 1st letter (0-3) identifies
  // the color sector where that square is found, the 2nd denotes the row
  // and the 3rd the column (counting from the center of the square)
  let coordinates = {
    row: null,
    column: null,
  };
  coordinates.row = parseInt(squareId[1]);
  coordinates.column = parseInt(squareId[2]);

  return coordinates;
};

export const getBaseSquareIdFromColor = (color) => {
  let row = ["yellow", "blue"].includes(color) ? 0 : 2;
  let column = 4;
  let id;

  if (color == "yellow") id = 0;
  else if (color == "blue") id = 1;
  else if (color == "red") id = 2;
  else if (color == "green") id = 3;

  return `${id}${row}${column}`;
};

export const getSquareIdFromCoordinates = (color, row, column) => {
  let id;

  if (color == "yellow") id = 0;
  else if (color == "blue") id = 1;
  else if (color == "red") id = 2;
  else if (color == "green") id = 3;

  return `${id}${row}${column}`;
};

export const isEqual = (obj1, obj2) => {
  let objectsEqual = false;

  const obj1Keys = Object.keys(obj1);
  const obj2Keys = Object.keys(obj2);

  if (obj1Keys.length === obj2Keys.length) {
    const areEqual = obj1Keys.every((key, index) => {
      const obj1Value = obj1[key];
      const obj2Value = obj2[key];

      return obj1Value === obj2Value;
    });

    objectsEqual = areEqual;
  }

  return objectsEqual;
};

