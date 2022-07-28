//
// Defines a node on an abstract syntax tree (AST) and associated functions.
//
function ASTNode() {
    this.name = "";
    this.value = null;
    this.children = [];



    this.addChild = function (node) { this.children.push(node); }

    this.clearChildren = function () { this.children = []; }

    // Returns the evaluation of the AST with the current node as a root,
    // according to the functions defined in library.
    this.evaluate = function (library) {

        // If the current node is a leaf, then its value should be a literal.
        if (this.children.length == 0) return this.value;

        // Adds the evaluation of each of the current node's children, to the 
        // args list. 
        var args = [];
        for (var i = 0; i < this.children.length; i++) {
            args.push(this.children[i].evaluate(library));
        }

        // If the current node represents a function defined in library, sets
        // the value of the current node to the return value of that function
        // called with args as its arguments.
        if (this.name in library.unaryOperators)
            this.value = library.unaryOperators[this.name](args);
        else if (this.name in library.binaryOperators)
            this.value = library.binaryOperators[this.name](args);
        else if (this.name in library.functions)
            this.value = library.functions[this.name](args);
        // If the current node represents an a scope expression (used for order
        // of operations), returns either the value of 
        else if (this.name == "(") {
            if (this.children.length == 1) this.value = this.children[0].value;
            else if (this.children.length > 1) {
                this.value = [];
                for (var i = 0; i < this.children.length; i++) {
                    this.value.push(this.children[i].value);
                }
            }
            else this.value = null;
        }
        // If the current node represents an unknown token, throws an error.
        else {
            throw "Unknown token: " + this.name;
            this.value = null;
        }

        // Returns the value of the current node, after it has been evaluated.
        return this.value;
    }

}


//
// Defines an abstract syntax tree (AST) and associated functions.
//
function AST(source, library) {

    this.source = source;
    this.library = library;



    // Returns the source string as an array of strings, split at anything
    // matching the regex. Throws out spaces and commas, but keeps all other
    // delimiters.
    this.getTokens = function () {
        var tokens = source.split(/[, ]|(?=[[\](){}])|(?<=[[\](){}])/g);
        tokens = tokens.filter(x => x !== "");
        return tokens;
    }

    // Returns a list of nodes, each one corresponding to entry from the 
    // tokenized source.
    this.getNodeList = function () {
        var tokens = this.getTokens();
        var nodes = [];
        for (var i = 0; i < tokens.length; i++) {
            var node = new ASTNode();
            node.name = tokens[i];
            nodes.push(node);
        }
        return nodes;
    }

    // Returns an ASTNode. This ASTNode will be the root of a tree representing
    // the scope of every node in the node list.
    this.getScopes = function () {
        var nodes = this.getNodeList();

        var root = new ASTNode();
        root.name = "(";

        // Uses balanced parentheses to determine the scope of each node.
        var stack = [];
        for (var i = 0; i < nodes.length; i++) {
            switch (nodes[i].name) {
                // If the node if an open parenthesis, creates a new scope
                // as a subscope of either the current scope or the root scope.
                case "(":
                    if (stack.length > 0) {
                        var parentIndex = stack[stack.length - 1];
                        nodes[parentIndex].addChild(nodes[i]);
                    } else {
                        root.addChild(nodes[i]);
                    }
                    stack.push(i);
                    break;
                // If the node is a closed parenthesis, closes the current scope.
                case ")":
                    stack.pop();
                    break;
                // If the node does not represent a parenthesis, adds the node 
                // to the scope represnted by the last open parenthesis.
                default:
                    if (stack.length > 0) {
                        var parentIndex = stack[stack.length - 1];
                        nodes[parentIndex].addChild(nodes[i]);
                    } else {
                        root.addChild(nodes[i]);
                    }
            }
        }

        // If the node list contains unbalanced parentheses, then the source
        // is not a valid expression. Throws an error.
        if (stack.length > 0) throw "Expected ')'";

        return root;
    }

    // Helper function to properly represent functions and arguments within 
    // the AST.
    this.simplifyFunctions = function (root) {
        for (var i = 0; i < root.children.length; i++) {
            this.simplifyFunctions(root.children[i], this.library);
        }
        for (var i = 0; i < root.children.length; i++) {
            if (root.children[i].name in this.library.functions) {
                if (root.children[i + 1].children.length > 0) {
                    root.children[i].children = root.children[i + 1].children;
                }
                else {
                    var emptyArgs = new ASTNode();
                    emptyArgs.value = null;
                    root.children[i].children = emptyArgs;
                }
                root.children.splice(i + 1, 1);
            }
        }
        for (var i = 0; i < root.children.length; i++) {
            if (root.children[i].name in this.library.binaryOperators) {
                root.children[i].children = [root.children[i - 1], root.children[i + 1]];
                root.children.splice(i + 1, 1);
                root.children.splice(i - 1, 1);
                i--;
            }
        }
        for (var i = 0; i < root.children.length; i++) {
            if (root.children[i].name in this.library.unaryOperators) {
                root.children[i].children = [root.children[i + 1]];
                root.children.splice(i + 1, 1);
            }
        }
    }

    // Helper function to set the values of nodes representing literals
    // (true/false and numbers) to their corresponding values.
    this.simplifyLiterals = function (root) {
        for (var i = 0; i < root.children.length; i++) {
            this.simplifyLiterals(root.children[i]);
        }
        for (var i = 0; i < root.children.length; i++) {
            var name = root.children[i].name;
            if (/^[-+]?\d*$/.test(name))
                root.children[i].value = parseInt(name);
            else if (name == "true")
                root.children[i].value = true;
            else if (name == "false")
                root.children[i].value = false;
        }
    }

    // Returns an AST constructed from this.source and this.library.
    this.getExpressions = function () {
        var root = this.getScopes();
        this.simplifyFunctions(root);
        this.simplifyLiterals(root);
        return root;
    }



    this.root = this.getExpressions();



    // Returns the evaluation of the root node.
    this.evaluate = function () {
        return this.root.evaluate(library);
    }

    // Returns true if the AST is a valid formal expression, false otherwise.
    this.valid = function () {
        try {
            this.evaluate();
            return true;
        }
        catch (exception) {
            return false;
        }
    }

}
