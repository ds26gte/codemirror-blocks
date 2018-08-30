import {
  empty, txt, horz, vert, concat, ifFlat, pretty, wrap, commaSep
} from "codemirror-blocks/pretty";


class Prettyable {
  pretty() {
    return txt("ok");
  }
}

class NotPrettyable {
  pretty() {
    return "ok";
  }
}

describe("The Pretty-Printing Doc Class", function() {

  it("Should be able to render nothing.", function() {
    expect(empty().display(10))
      .toEqual([""]);
  });

  it("Should be able to render literal text.", function() {
    expect(txt("literal text").display(20))
      .toEqual(["literal text"]);
  });

  it("Should be able to vertically concatenate.", function() {
    expect(vert(txt("aaaa"), txt("bbb")).display(20))
      .toEqual(["aaaa", "bbb"]);
  });

  it("Should be able to horizontally concatenate.", function() {
    expect(horz(txt("aaaa"), vert(txt("bb"), txt("cc"))).display(20))
      .toEqual(["aaaabb", "    cc"]);
  });

  it("Should be able to simply concatenate.", function() {
    expect(concat(txt("aaaa"), vert(txt("bb"), txt("cc"))).display(20))
      .toEqual(["aaaabb", "cc"]);
  });

  it("Should be able to interpret magic pretty templates.", function() {
    let one = txt("1");
    let two = txt("2");
    expect(pretty`aaaa ${one}\nb\n  ${two}`.display(10))
      .toEqual(["aaaa 1", "b", "  2"]);
  });

  it("Should be able to separate things by commas nicely.", function() {
    let items = ["1", "22", "333", "4444", "55555"].map(s => txt(s));
    expect(commaSep(items).display(23))
      .toEqual(["1, 22, 333, 4444, 55555"]);
    expect(commaSep(items).display(22))
      .toEqual(["1,", "22,", "333,", "4444,", "55555"]);
  });

  it("Should coerce Strings to txt.", function() {
    expect(horz("Hello", " ", "world"))
      .toEqual(horz(txt("Hello"), txt(" "), txt("world")));
  });

  it("Should try calling .pretty() on things that aren't Docs.", function() {
    expect(vert(new Prettyable(), new Prettyable()).display(""))
      .toEqual(["ok", "ok"]);
  });

  it("Should error if calling .pretty() doesn't return a Doc.", function() {
    expect(function() {
      vert(new NotPrettyable(), new NotPrettyable())
    }).toThrow(new Error("The pretty printer called the `.pretty()` function, and expected it to return a Doc, but instead it returned: [object Object]"));
  });

  it("Should error if an argument can't be coerced to a Doc.", function() {
    expect(function() {
      concat(666);
    }).toThrow(new Error("The pretty printer was expecting a Doc (or a String, or something with a pretty() method), but instead it was given: 666"));
  });

  describe("on the example from the documentation", function() {
    function binop(left, op, right) {
      return ifFlat(
        pretty`${left} ${op} ${right}`,
        pretty`${left}\n${op} ${right}`)
    }

    function ifte2(c, t, e) {
      return ifFlat(
        pretty`if (${c}) { ${t} } else { ${e} }`,
        pretty`if (${c}) {\n  ${t}\n} else {\n  ${e}\n}`);
    }

    function docExample() {
      return ifte2(binop("a", "==", "b"),
                   binop("a", "<<", "2"),
                   binop("a", "+", "b"));
    }

    it("should match the documentation.", function() {
      expect(docExample().display(37))
          .toEqual(["if (a == b) { a << 2 } else { a + b }"]);
      expect(docExample().display(35))
          .toEqual(["if (a == b) {", "  a << 2", "} else {", "  a + b", "}"]);
    });
  });

  describe("when wrapping words", function() {
    function longExample() {
    }

    it("should be able to wrap an eight-word sentence.", function() {
      let sentence =
        wrap(txt(" "), empty(),
             ["This", "is", "a", "sentence", "with", "eight", "words"]
             .map(txt));
      expect(sentence.display(40))
        .toEqual(["This is a sentence with eight words"]);
      expect(sentence.display(30))
        .toEqual(["This is a sentence with eight", "words"]);
      expect(sentence.display(20))
        .toEqual(["This is a sentence", "with eight words"]);
      expect(sentence.display(10))
        .toEqual(["This is a",  "sentence", "with eight", "words"]);
    });

    it("should be able to wrap a hundred-word paragraph.", function() {
      let sentence =
        ["This", "is", "a", "long", "paragraph", "with", "exactly", "one", "hundred", "words."];
      let para = new Array();
      for (let i = 0; i < 10; i++) {
        para = para.concat(sentence);
      }
      para = wrap(txt(" "), empty(), para.map(txt));
      expect(para.display(55).join("\n"))
      .toEqual(`This is a long paragraph with exactly one hundred
words. This is a long paragraph with exactly one
hundred words. This is a long paragraph with exactly
one hundred words. This is a long paragraph with
exactly one hundred words. This is a long paragraph
with exactly one hundred words. This is a long
paragraph with exactly one hundred words. This is a
long paragraph with exactly one hundred words. This is
a long paragraph with exactly one hundred words. This
is a long paragraph with exactly one hundred words.
This is a long paragraph with exactly one hundred
words.`);
    });
  });

  describe("when rendering if/then/else statements", function() {
    function binop(left, op, right) {
      return ifFlat(
        pretty`${left} ${op} ${right}`,
        pretty`${left}\n${op} ${right}`)
    }

    function optBreak(x, y) {
      return ifFlat(
        pretty`${x} ${y}`,
        pretty`${x}\n  ${y}`)
    }

    function ifte(c, t, e) {
      return ifFlat(
        pretty`if ${c} then ${t} else ${e}`,
        vert(optBreak(txt("if"), c),
             optBreak(txt("then"), t),
             optBreak(txt("else"), e)));
    }
    
    function BLernersExample() {
      return ifte(binop("a", "==", "b"),
                  binop("a", "<<", "2"),
                  binop("a", "+", "b"));
    }

    it("should render them the way that BLerner like them.", function() {
      expect(BLernersExample().display(32))
        .toEqual(["if a == b then a << 2 else a + b"]);
      expect(BLernersExample().display(15))
        .toEqual(["if a == b", "then a << 2", "else a + b"]);
      expect(BLernersExample().display(10))
        .toEqual(["if a == b", "then", "  a << 2", "else a + b"]);
    });
  });

  describe("when compared against Bernardy's algorithm", function() {
    function plus(doc1, doc2) {
      return ifFlat(
        pretty`${doc1} + ${doc2}`,
        pretty`${doc1}\n+ ${doc2}`)
    }

    function times(doc1, doc2) {
      return ifFlat(
        pretty`${doc1} * ${doc2}`,
        pretty`${doc1}\n* ${doc2}`)
    }

    function BernardysHeel() {
      return plus(times(txt("aaaaaaaaa"), txt("bb")),
                  txt("cc"));
    }

    it("should be exactly the same on most inputs.", function() {
      expect(BernardysHeel().display(19))
      .toEqual(["aaaaaaaaa * bb + cc"]);
      expect(BernardysHeel().display(18))
      .toEqual(["aaaaaaaaa * bb", "+ cc"]);
    });

    it("should choose a better layout for this example.", function() {
      // Bernardy would return "aaaaaaaaa\n* bb + cc" here,
      // which is a little questionable.
      expect(BernardysHeel().display(13))
      .toEqual(["aaaaaaaaa", "* bb", "+ cc"]);
    });
  });

  describe("when computing flat widths", function() {
    it("should be null for docs containing a newline", function() {
      expect(horz(vert(empty(), empty()), empty()).flat_width)
      .toBe(null);

      expect(horz(empty(), vert(empty(), empty())).flat_width)
      .toBe(null);

      expect(concat(vert(empty(), empty()), empty()).flat_width)
      .toBe(null);

      expect(concat(empty(), vert(empty(), empty())).flat_width)
      .toBe(null);
    });

    it("should handle weird edge cases correctly", function() {
      expect(ifFlat(vert(empty(), empty()), txt("four")).flat_width)
      .toBe(4);

      expect(ifFlat(txt("longer"), txt("four")).flat_width)
      .toBe(4);

      expect(ifFlat(txt("1"), txt("four")).flat_width)
      .toBe(1);
    });
  });
});
