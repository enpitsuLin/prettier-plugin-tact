message Message1 {
  foo: Int;
}

message Message2 {
  foo: Int;
}

message Message3 {
  foo: Int as uint32;
}

message(0x000001) Message4 {
  foo: Int;
}

message(0x000002) Message5 {
  foo: Int as uint32;
}

message Message6 {
  foo: Int;
  bar: Slice;
}

message(0x000003) Message7 {
  foo: Int;
  bar: Slice;
}

message Message8 {
  foo: Int;
  bar: Slice;
  baz: String;
}

message(0x000004) Message9 {
  foo: Int;
  bar: Slice;
  baz: String;
}
