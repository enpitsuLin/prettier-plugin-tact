contract TryCatch{
  fun braveAndTrue() {
    // Lets try and do something erroneous
    try {
        nativeThrow(42); // throwing with exit code 42
    }
 
    // The following will be executed as the erroneous code above was wrapped in a try block
    dump(42);
  }


  fun niceCatch() {
    // Lets try and do something erroneous
    try {
        nativeThrow(42); // throwing with exit code 42
    } catch (err) {
        dump(err);       // this will dump the exit code caught, which is 42
    }
  }


  fun nested(){
    try {
      // Preparing an x equal to 0, in such a way that Tact compiler won't realize it (yet!)
      let xs: Slice = beginCell().storeUint(0, 1).endCell().beginParse();
      let x: Int = xs.loadUint(1); // 0
  
      try {
          throw(101);     // 1. throws with exit code 101
      } catch (err) {     // 2. catches the error and captures its exit code (101) as err
          return err / x; // 3. divides err by x, which is zero, throwing with exit code 4
      }
    
    } catch (err) {         // 4. catches the new error and captures its exit code (4) as err
        //   ^^^ this works without name collisions because the previous err
        //       has a different scope and is only visible inside the previous catch block
    
        dump(err);          // 5. dumps the last caught exit code (4)
    }
  }


  fun discarded(){
    try {
      throw(42);
    } catch (_) {
      dump("I don't know the exit code anymore");
    }
  }

}
