class ModularProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.t = 0;
    this.targetHz = 8000;
    this.compiledStatements = []; 
    this.isPlaying = false; 

    this.port.onmessage = (event) => {
      if (event.data.type === 'updateFormula') {
        this.compiledStatements = this.parseScript(event.data.code);
      } else if (event.data.type === 'togglePlay') {
        this.isPlaying = event.data.value;
      } else if (event.data.type === 'stopPlayback') {
        this.isPlaying = false;
        this.t = 0; 
        this.port.postMessage({ type: 'clockReset', t: 0 });
      }
    };
  }

  parseScript(code) {
    let rawCode = code.replace(/return/g, '').trim();
    let lines = rawCode.split(/(?:[;\n]+|,(?![^\[]*\]))/g);
    let parsedLines = [];
    lines.forEach(line => {
      line = line.trim();
      if (!line) return;
      if (line.includes('=')) {
        let parts = line.split('=');
        let varName = parts[0].trim();
        let expr = parts.slice(1).join('=').trim();
        parsedLines.push({ type: 'assign', name: varName, expr: this.tokenize(expr) });
      } else {
        parsedLines.push({ type: 'evaluate', expr: this.tokenize(line) });
      }
    });
    return parsedLines;
  }

  tokenize(str) {
    str = str.replace(/\s+/g, '');
    const matches = str.match(/(?:\*\*|>>|<<|[|&^+-\/*%()\[\],])|([a-zA-Z_][a-zA-Z0-9_]*)|([0-9.]+)/g);
    return matches || ["0"];
  }

  evaluateExpression(tokens, scope) {
    let stack = [];
    let operators = [];
    const precedence = { ',': 0, '|': 1, '^': 2, '&': 3, '<<': 4, '>>': 4, '+': 5, '-': 5, '*': 6, '/': 6, '%': 6, '**': 7 };

    const applyOp = () => {
      let op = operators.pop();
      let b = stack.pop();
      let a = stack.pop();
      if (op === ',') {
        if (Array.isArray(a)) { a.push(b); stack.push(a); }
        else { stack.push([a, b]); }
        return;
      }
      let numB = Number(Array.isArray(b) ? b : b) || 0;
      let numA = Number(Array.isArray(a) ? a : a) || 0;
      if (op === '+') stack.push(numA + numB);
      else if (op === '-') stack.push(numA - numB);
      else if (op === '*') stack.push(numA * numB);
      else if (op === '/') stack.push(numB !== 0 ? Math.floor(numA / numB) : 0);
      else if (op === '%') stack.push(numB !== 0 ? numA % numB : 0);
      else if (op === '>>') stack.push(numA >> numB);
      else if (op === '<<') stack.push(numA << numB);
      else if (op === '&') stack.push(numA & numB);
      else if (op === '|') stack.push(numA | numB);
      else if (op === '^') stack.push(numA ^ numB);
      else if (op === '**') stack.push(Math.pow(numA, numB));
    };

    for (let i = 0; i < tokens.length; i++) {
      let tok = tokens[i];
      if (tok === 't') stack.push(scope.t);
      else if (tok === 'in1') stack.push(scope.in1);
      else if (tok === 'in2') stack.push(scope.in2);
      else if (tok === 'sr') stack.push(this.targetHz);
      else if (scope.vars[tok] !== undefined) stack.push(scope.vars[tok]);
      else if (!isNaN(tok)) stack.push(Number(tok));
      else if (tok === '(' || tok === '[') operators.push(tok);
      else if (tok === ')') {
        while (operators.length && operators[operators.length - 1] !== '(') applyOp();
        operators.pop();
      } else if (tok === ']') {
        while (operators.length && operators[operators.length - 1] !== '[') applyOp();
        operators.pop(); 
        if (stack.length >= 2) {
          let index = Math.floor(Number(stack.pop())) || 0;
          let targetArray = stack.pop();
          if (Array.isArray(targetArray)) {
            stack.push(targetArray[index] !== undefined ? targetArray[index] : 0);
          } else { stack.push(targetArray); }
        }
      } else if (precedence[tok] !== undefined) {
        while (operators.length && precedence[operators[operators.length - 1]] >= precedence[tok]) applyOp();
        operators.push(tok);
      }
    }
    while (operators.length) applyOp();
    let res = stack.pop();
    if (Array.isArray(res) && res.length === 1) return res;
    return res !== undefined ? res : 0;
  }

  process(inputs, outputs, parameters) {
    const outputDevice = outputs[0];
    if (!outputDevice || !outputDevice[0]) return true;
    const channel = outputDevice[0];
    
    const hasIn1 = inputs[0] && inputs[0].length > 0;
    const hasIn2 = inputs[1] && inputs[1].length > 0;

    if (this.isPlaying) {
        this.port.postMessage({ type: 'clockUpdate', t: this.t + channel.length });
    }

    for (let i = 0; i < channel.length; i++) {
      if (this.isPlaying) this.t++;
      
      let sampleIn1 = hasIn1 ? Math.floor((inputs[0][0][i] + 1) * 128) : 0;
      let sampleIn2 = hasIn2 ? Math.floor((inputs[1][0][i] + 1) * 128) : 0;

      let scope = { t: this.t, in1: sampleIn1, in2: sampleIn2, vars: {} };
      let finalValue = 0;

      this.compiledStatements.forEach(stmt => {
        if (stmt.type === 'assign') {
          scope.vars[stmt.name] = this.evaluateExpression(stmt.expr, scope);
        } else if (stmt.type === 'evaluate') {
          finalValue = this.evaluateExpression(stmt.expr, scope);
        }
      });

      let resultNum = Number(Array.isArray(finalValue) ? finalValue : finalValue) || 0;
      channel[i] = this.isPlaying ? ((resultNum & 255) / 128 - 1) : 0;
    }
    return true;
  }
}

registerProcessor('modular-processor', ModularProcessor);
