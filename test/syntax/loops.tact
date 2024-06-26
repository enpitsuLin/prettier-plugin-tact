fun loops(){
  {
    let twoPow: Int = 1;
    repeat (10) {  // repeat exactly 10 times
        twoPow *= 2;
    }
  }

  {
    let x: Int = 10;
    while (x > 0) {
        x -= 1;
    }
  }

  {
    let x: Int = 10;
    do {
        x -= 1;  // executes this code block at least once
    } until (x <= 0);
  }

  {
    // Empty map
    let cells: map<Int, Cell> = emptyMap();
    
    // Setting four entries
    cells.set(1, beginCell().storeUint(100, 16).endCell());
    cells.set(2, beginCell().storeUint(200, 16).endCell());
    cells.set(3, beginCell().storeUint(300, 16).endCell());
    cells.set(4, beginCell().storeUint(400, 16).endCell());
    
    // A variable for summing up the values
    let sum: Int = 0;
    
    // For each key and value pair in cells map, do:
    foreach (key, value in cells) { // or just k, v
        let s: Slice = value.beginParse(); // convert Cell to Slice
        sum += s.loadUint(16);             // sum the Slice values
    }
    dump(sum); // 1000
  }

  {
    // Empty map
    let quartiles: map<Int, Int> = emptyMap();
    
    // Setting some entries
    quartiles.set(1, 25);
    quartiles.set(2, 50);
    quartiles.set(3, 75);
    
    // Discarding captured keys
    // without modifying them in the map itself
    foreach (_, value in quartiles) {}
    
    // Discarding captured values
    // without modifying them in the map itself
    foreach (key, _ in quartiles) {}
    
    // Discarding both keys and values
    // without modifying them in the map itself
    foreach (_, _ in quartiles) {
        // Can't access via _, but can do desired operations
        // n times, where n is the current length of the map
    }
  }
}
