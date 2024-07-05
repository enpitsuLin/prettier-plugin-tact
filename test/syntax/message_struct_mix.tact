struct Point {
  x: Int as int64;
  y: Int as int64;
}

struct Line {
  start: Point;
  end: Point;
}

message Message {
  line: Line;
  start: Point;
  end: Point;
}
