const EXPRESSION_SYMBOLS_REGEX = /(-\d+\.\d+)|(-\d+)|(\d+\.\d+)|(\d+)|([()/*+^])|(-)(?!\d)|(sin)/g

type FirstOrderOperationSign = "*" | "/" | "^";
type SecondOrderOperationSign = "+" | "-";
type UnaryLeftSign = "sin";
type OperationSign = FirstOrderOperationSign | SecondOrderOperationSign;

function isSecondOrderOperationSign(val : string) : val is SecondOrderOperationSign {
    return val === "+" || val === "-";
}

function isFirstOrderOperationSign(val : string) : val is FirstOrderOperationSign {
    return val === "*" || val === "/" || val === "^";
}

function isOperationSign(val : string) : val is OperationSign {
    return isFirstOrderOperationSign(val) || isSecondOrderOperationSign(val);
}

function isUnarySign(val : string) : val is UnaryLeftSign {
    return val === "sin";
}

function callOperation(left : number, right : number, operation : OperationSign) : number {
    switch (operation) {
        case "+":
            return left + right;
        case "-":
            return left - right;
        case "/":
            return left / right;
        case "*":
            return left * right;
        case "^":
            return Math.pow(left, right);
    }
}

function callUnaryLeftOperation(target : number, operation : UnaryLeftSign) : number {
    switch (operation) {
        case "sin":
            return Math.sin(target);
    }
}

type Tree<T> = (T | Tree<T>)[];

type Predicate<T> = (arg : T) => boolean;

export function calc(input : string) : number {
    const symbols = toSymbols(input);
    const tree = collapse(symbols);
    return calculate(tree);
}

function toSymbols(input : string) : string[] {
    return input.match(EXPRESSION_SYMBOLS_REGEX) as string[];
}

function collapse(symbols : string[]) : Tree<string> {

    let thisSymbols : Tree<string> = [];
    let innerSymbols : string[] = [];

    let depth = 0;

    symbols.forEach((s) => {
        depth === 0
        ? handleThis(s)
        : handleInner(s);
    });

    return thisSymbols;

    function handleThis(s : string) {
        if (s === "(") {
            depth++;
        } else {
            thisSymbols.push(s);
        }
    }

    function handleInner(s : string) {
        if (s === ")") {
            depth--;
            if (depth === 0) {
                thisSymbols.push(collapse(innerSymbols));
                innerSymbols = [];
                return;
            }
        } else if (s === "(") {
            depth++;
        }
        innerSymbols.push(s)
    }
}

// symbols: val (number as string | symbols) -> op -> val -> op ... -> val
function calculate(symbols : Tree<string | number>) : number {

    handleInner();
    handleUnaryMinus();
    handleUnaryLeftOperation();
    handleBiOperationIf(isFirstOrderOperationSign);
    handleBiOperationIf(isSecondOrderOperationSign);

    return Number(symbols[0]);

    function handleInner() {
        for (let i = 0; i < symbols.length; i++) {
            if (Array.isArray(symbols[i])) {
                symbols[i] = calculate(symbols[i] as Tree<string>);
            }
        }
    }

    function handleUnaryMinus() {
        let i = symbols.length - 1;

        function splice() {
            symbols.splice(i - 1, 1);
            i--;
        }

        for (i; i >= 1; i--) {
            let target = symbols[i - 1];
            let next = symbols[i - 2];
            if (target === "-" && isOperationSign(next as OperationSign)) {
                symbols[i] = -symbols[i];
                splice();
            } else {
                let a = Number.parseFloat(target as string);
                let b = Number.parseFloat(symbols[i] as string);
                if (!isNaN(a) && !isNaN(b)) {
                    symbols[i] = a + b;
                    splice();
                }
            }
        }

        if (symbols.length === 2) {
            let first = symbols[0];
            let second = symbols[1];
            if (first === "-") {
                second = -second;
            } else {
                second = Number(first) + Number(second);
            }
            symbols = [second];
        }
    }

    function handleUnaryLeftOperation() {
        let i = symbols.length - 1;

        function splice() {
            symbols.splice(i - 1, 1);
            i--;
        }

        for (i; i >= 1; i--) {
            let target = symbols[i];
            let operation = symbols[i - 1];

            if (isUnarySign(operation as string)) {
                symbols[i] = callUnaryLeftOperation(target as number, operation as UnaryLeftSign);
                splice();
            }
        }
    }

    function handleBiOperationIf(predicate : Predicate<string>) {
        for (let i = 0; i < symbols.length - 2; i += 2) {
            let left = symbols[i];
            let sign = symbols[i + 1];
            let right = symbols[i + 2];

            if (predicate(sign as string)) {
                symbols[i] = callOperation(Number(left as string), Number(right as string), sign as OperationSign);
                symbols.splice(i + 1, 2);
                i -= 2;
            }
        }
    }
}

const tests : [string, number][] = [
    ['1+1', 2],
    ['1 - 1', 0],
    ['1* 1', 1],
    ['1 /1', 1],
    ['-123', -123],
    ['123', 123],
    ['2 /2+3 * 4.75- -6', 21.25],
    ['12* 123', 1476],
    ['2 / (2 + 3) * 4.33 - -6', 7.732],
    ['12* 123/-(-5 + 2)', 492],
    ['((80 - (19)))', 61],
    ['(1 - 2) + -(-(-(-4)))', 3],
    ['123.45*(678.90 / (-2.5+ 11.5)-(80 -19) *33.25) / 20 + 11', -12042.760875],
    ['12 + Math.sin(-3.2) / Math.sin(-2)', 11.935803025824717],
    ['12 ^ 2 - 14', 130]
];

tests.forEach(function ([arg, expected]) {
    try {
        const actual = calc(arg);
        console.log(
            arg + "\n" + (
                actual === expected
                ? "succeed"
                : ("failed" +
                    "\nexpected: " + expected +
                    "\n     got: " + actual)
            )
        );
    } catch (e) {
        console.log(arg + " failed", e);
    }
});

function log(val : any, label : any = undefined) {
    if (label === 1 || label === 5)
        console.log(label ? label : "", JSON.parse(JSON.stringify(val)));
}