using Antlr4.Runtime;
using Antlr4.Runtime.Tree;
using System.ComponentModel;
using static P4.TinyCell.Tests.Utility;

namespace P4.TinyCell.Tests.UnitTests.Parser;

public class ParserTreeStructure
{
    [Fact]
    [Description("Validates the structure of the parse tree for the document rule")]
    public void ParserDocumentStructureTest()
    {
        var tokens = new List<IToken>
        {
            new TestToken("setup", TinyCellLexer.SETUP),
            new TestToken("{", TinyCellLexer.LCURLY),
            new TestToken("}", TinyCellLexer.RCURLY),
            new TestToken("update", TinyCellLexer.UPDATE),
            new TestToken("{", TinyCellLexer.LCURLY),
            new TestToken("}", TinyCellLexer.RCURLY),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var doc = parser.document();

        Assert.NotNull(doc);

        Assert.Equal(2, doc.ChildCount);

        Assert.IsType<TinyCellParser.SetupDefinitionContext>(doc.GetChild(0));
        Assert.IsType<TinyCellParser.UpdateDefinitionContext>(doc.GetChild(1));
    }

    [Fact]
    [Description("Validates the structure of the parse tree for the setup rule")]
    public void ParserSetupStructureTest()
    {
        var tokens = new List<IToken>
        {
            new TestToken("setup", TinyCellLexer.SETUP),
            new TestToken("{", TinyCellLexer.LCURLY),
            new TestToken("}", TinyCellLexer.RCURLY),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var setup = parser.setupDefinition();

        Assert.NotNull(setup);

        Assert.Equal(2, setup.ChildCount);

        Assert.IsType<TinyCellParser.SetupDefinitionContext>(setup);
    }

    [Fact]
    [Description("Validates the structure of the parse tree for the update rule")]
    public void ParserUpdateStructureTest()
    {
        var tokens = new List<IToken>
        {
            new TestToken("update", TinyCellLexer.UPDATE),
            new TestToken("{", TinyCellLexer.LCURLY),
            new TestToken("}", TinyCellLexer.RCURLY),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var update = parser.updateDefinition();

        Assert.NotNull(update);

        Assert.Equal(2, update.ChildCount);

        Assert.IsType<TinyCellParser.UpdateDefinitionContext>(update);
    }

    [Fact]
    [Description("Validates the structure of the parse tree for an if statement")]
    public void ParserIfStatementStructureTest()
    {
        var tokens = new List<IToken>
        {
            new TestToken("if", TinyCellLexer.IF),
            new TestToken("(", TinyCellLexer.LPAR),
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("==", TinyCellLexer.EQ),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken(")", TinyCellLexer.RPAR),
            new TestToken("{", TinyCellLexer.LCURLY),
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("=", TinyCellLexer.ASSIGN),
            new TestToken("6", TinyCellLexer.IntNumeral),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("}", TinyCellLexer.RCURLY),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var ifStatement = parser.ifStatement();

        Assert.NotNull(ifStatement);

        Assert.Equal(5, ifStatement.ChildCount);

        Assert.IsType<TerminalNodeImpl>(ifStatement.GetChild(0));
        Assert.IsType<TerminalNodeImpl>(ifStatement.GetChild(1));
        Assert.IsType<TinyCellParser.ExpressionContext>(ifStatement.GetChild(2));
        Assert.IsType<TerminalNodeImpl>(ifStatement.GetChild(3));
        Assert.IsType<TinyCellParser.CompoundStatementContext>(ifStatement.GetChild(4));
    }

    [Fact]
    [Description("Validates the structure of the parse tree for an if-else statement")]
    public void ParserIfElseStatementStructureTest()
    {
        var tokens = new List<IToken>
        {
            new TestToken("if", TinyCellLexer.IF),
            new TestToken("(", TinyCellLexer.LPAR),
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("==", TinyCellLexer.EQ),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken(")", TinyCellLexer.RPAR),
            new TestToken("{", TinyCellLexer.LCURLY),
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("=", TinyCellLexer.ASSIGN),
            new TestToken("6", TinyCellLexer.IntNumeral),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("}", TinyCellLexer.RCURLY),
            new TestToken("else", TinyCellLexer.ELSE),
            new TestToken("{", TinyCellLexer.LCURLY),
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("=", TinyCellLexer.ASSIGN),
            new TestToken("7", TinyCellLexer.IntNumeral),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("}", TinyCellLexer.RCURLY),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var ifElseStatement = parser.ifStatement();

        Assert.NotNull(ifElseStatement);

        Assert.Equal(7, ifElseStatement.ChildCount);

        Assert.IsType<TerminalNodeImpl>(ifElseStatement.GetChild(0));
        Assert.IsType<TerminalNodeImpl>(ifElseStatement.GetChild(1));
        Assert.IsType<TinyCellParser.ExpressionContext>(ifElseStatement.GetChild(2));
        Assert.IsType<TerminalNodeImpl>(ifElseStatement.GetChild(3));
        Assert.IsType<TinyCellParser.CompoundStatementContext>(ifElseStatement.GetChild(4));
        Assert.IsType<TerminalNodeImpl>(ifElseStatement.GetChild(5));
        Assert.IsType<TinyCellParser.CompoundStatementContext>(ifElseStatement.GetChild(6));
    }

    [Fact]
    [Description("Validates the structure of the parse tree for a while statement")]
    public void ParserWhileStatementStructureTest()
    {
        var tokens = new List<IToken>
        {
            new TestToken("while", TinyCellLexer.WHILE),
            new TestToken("(", TinyCellLexer.LPAR),
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("==", TinyCellLexer.EQ),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken(")", TinyCellLexer.RPAR),
            new TestToken("{", TinyCellLexer.LCURLY),
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("=", TinyCellLexer.ASSIGN),
            new TestToken("6", TinyCellLexer.IntNumeral),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("}", TinyCellLexer.RCURLY),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var whileStatement = parser.loopStatement();

        Assert.NotNull(whileStatement);

        Assert.Equal(5, whileStatement.ChildCount);

        Assert.IsType<TerminalNodeImpl>(whileStatement.GetChild(0));
        Assert.IsType<TerminalNodeImpl>(whileStatement.GetChild(1));
        Assert.IsType<TinyCellParser.ExpressionContext>(whileStatement.GetChild(2));
        Assert.IsType<TerminalNodeImpl>(whileStatement.GetChild(3));
        Assert.IsType<TinyCellParser.CompoundStatementContext>(whileStatement.GetChild(4));
    }

    [Fact]
    [Description("Validates the structure of the parse tree for a for statement")]
    public void ParserForStatementStructureTest()
    {
        var tokens = new List<IToken>
        {
            new TestToken("for", TinyCellLexer.FOR),
            new TestToken("(", TinyCellLexer.LPAR),
            new TestToken("int", TinyCellLexer.INT),
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("=", TinyCellLexer.ASSIGN),
            new TestToken("0", TinyCellLexer.IntNumeral),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("<", TinyCellLexer.LT),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("++", TinyCellLexer.UNARYPLUS),
            new TestToken(")", TinyCellLexer.RPAR),
            new TestToken("{", TinyCellLexer.LCURLY),
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("=", TinyCellLexer.ASSIGN),
            new TestToken("6", TinyCellLexer.IntNumeral),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("}", TinyCellLexer.RCURLY),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var forStatement = parser.loopStatement();

        Assert.NotNull(forStatement);

        Assert.Equal(9, forStatement.ChildCount);

        Assert.IsType<TerminalNodeImpl>(forStatement.GetChild(0));
        Assert.IsType<TerminalNodeImpl>(forStatement.GetChild(1));
        Assert.IsType<TinyCellParser.DeclarationContext>(forStatement.GetChild(2));
        Assert.IsType<TerminalNodeImpl>(forStatement.GetChild(3));
        Assert.IsType<TinyCellParser.ExpressionContext>(forStatement.GetChild(4));
        Assert.IsType<TerminalNodeImpl>(forStatement.GetChild(5));
        Assert.IsType<TinyCellParser.ExpressionContext>(forStatement.GetChild(6));
        Assert.IsType<TerminalNodeImpl>(forStatement.GetChild(7));
        Assert.IsType<TinyCellParser.CompoundStatementContext>(forStatement.GetChild(8));
    }

    // The tests below are dedicated to the structure of the parse tree for various contexts
    [Fact]
    [Description("Validates the structure of the parse tree for a declaration")]
    public void ParserDeclarationStructureTest()
    {
        var tokens = new List<IToken>
        {
            new TestToken("int", TinyCellLexer.INT),
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var statement = parser.statement();

        Assert.NotNull(statement);

        Assert.Equal(2, statement.ChildCount);

        Assert.IsType<TinyCellParser.DeclarationContext>(statement.GetChild(0));
    }

    [Fact]
    [Description("Validates the structure of the parse tree for an assignment")]
    public void ParserAssignmentStructureTest()
    {
        var tokens = new List<IToken>
        {
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("=", TinyCellLexer.ASSIGN),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var statement = parser.statement();

        Assert.NotNull(statement);

        Assert.Equal(2, statement.ChildCount);

        Assert.IsType<TinyCellParser.AssignmentContext>(statement.GetChild(0));
    }

    [Fact]
    [Description("Validates the structure of the parse tree for a ternary expression")]
    public void ParserTernaryExpressionStructureTest()
    {
        var tokens = new List<IToken>
        {
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("?", TinyCellLexer.QUESTION),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken(":", TinyCellLexer.COLON),
            new TestToken("6", TinyCellLexer.IntNumeral),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var expression = parser.expression();

        Assert.NotNull(expression);

        Assert.Equal(1, expression.ChildCount);

        Assert.IsType<TinyCellParser.ExpressionContext>(expression);
    }

    // The tests below are dedicated to the structure of the parse tree for various expressions
    [Fact]
    [Description("Validates the structure of the parse tree for arithmetic operators")]
    public void ParserArithmeticOperatorsStructureTest()
    {
        var tokens = new List<IToken>
        {
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("=", TinyCellLexer.ASSIGN),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken("+", TinyCellLexer.PLUS),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken("-", TinyCellLexer.MINUS),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken("*", TinyCellLexer.MULT),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken("/", TinyCellLexer.DIV),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var expression = parser.expression();

        Assert.NotNull(expression);

        Assert.Equal(1, expression.ChildCount);

        Assert.IsType<TinyCellParser.ExpressionContext>(expression);
    }

    [Fact]
    [Description("Validates the structure of the parse tree for comparison operators")]
    public void ParserComparisonOperatorsStructureTest()
    {
        var tokens = new List<IToken>
        {
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("=", TinyCellLexer.ASSIGN),
            new TestToken("y", TinyCellLexer.Identifier),
            new TestToken("==", TinyCellLexer.EQ),
            new TestToken("z", TinyCellLexer.Identifier),
            new TestToken("!=", TinyCellLexer.NEQ),
            new TestToken("a", TinyCellLexer.Identifier),
            new TestToken("<", TinyCellLexer.LT),
            new TestToken("b", TinyCellLexer.Identifier),
            new TestToken(">", TinyCellLexer.GT),
            new TestToken("c", TinyCellLexer.Identifier),
            new TestToken("<=", TinyCellLexer.LTE),
            new TestToken("d", TinyCellLexer.Identifier),
            new TestToken(">=", TinyCellLexer.GTE),
            new TestToken("e", TinyCellLexer.Identifier),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var expression = parser.expression();

        Assert.NotNull(expression);

        Assert.Equal(1, expression.ChildCount);

        Assert.IsType<TinyCellParser.ExpressionContext>(expression);
    }

    [Fact]
    [Description("Validates the structure of the parse tree for assignment operators")]
    public void ParserAssignmentOperatorsStructureTest()
    {
        var tokens = new List<IToken>
        {
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("=", TinyCellLexer.ASSIGN),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken("+", TinyCellLexer.PLUS),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken("-", TinyCellLexer.MINUS),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken("*", TinyCellLexer.MULT),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken("/", TinyCellLexer.DIV),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var expression = parser.expression();

        Assert.NotNull(expression);

        Assert.Equal(1, expression.ChildCount);

        Assert.IsType<TinyCellParser.ExpressionContext>(expression);
    }

    [Fact]
    [Description("Validates the structure of the parse tree for function calls with no arguments")]
    public void ParserFunctionCallNoArgumentsStructureTest()
    {
        var tokens = new List<IToken>
        {
            new TestToken("foo", TinyCellLexer.Identifier),
            new TestToken("(", TinyCellLexer.LPAR),
            new TestToken(")", TinyCellLexer.RPAR),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var expression = parser.expression();

        Assert.NotNull(expression);

        Assert.Equal(1, expression.ChildCount);

        Assert.IsType<TinyCellParser.ExpressionContext>(expression);
    }

    [Fact]
    [Description("Validates the structure of the parse tree for function calls with arguments")]
    public void ParserFunctionCallWithArgumentsStructureTest()
    {
        var tokens = new List<IToken>
        {
            new TestToken("foo", TinyCellLexer.Identifier),
            new TestToken("(", TinyCellLexer.LPAR),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken(")", TinyCellLexer.RPAR),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var expression = parser.expression();

        Assert.NotNull(expression);

        Assert.Equal(1, expression.ChildCount);

        Assert.IsType<TinyCellParser.ExpressionContext>(expression);
    }

    [Fact]
    [Description("Validates the structure of the parse tree for IntNumeral assignment")]
    public void ParserIntNumeralAssignmentStructureTest()
    {
        var tokens = new List<IToken>
        {
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("=", TinyCellLexer.ASSIGN),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var expression = parser.expression();

        Assert.NotNull(expression);

        Assert.Equal(1, expression.ChildCount);

        Assert.IsType<TinyCellParser.ExpressionContext>(expression);
    }

    [Fact]
    [Description("Validates the structure of the parse tree for string assignment")]
    public void ParserStringAssignmentStructureTest()
    {
        var tokens = new List<IToken>
        {
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("=", TinyCellLexer.ASSIGN),
            new TestToken("\"hello\"", TinyCellLexer.String),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var expression = parser.expression();

        Assert.NotNull(expression);

        Assert.Equal(1, expression.ChildCount);

        Assert.IsType<TinyCellParser.ExpressionContext>(expression);
    }

    [Fact]
    [Description("Validates the structure of the parse tree for boolean assignment")]
    public void ParserBooleanAssignmentStructureTest()
    {
        var tokens = new List<IToken>
        {
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("=", TinyCellLexer.ASSIGN),
            new TestToken("true", TinyCellLexer.Bool),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var expression = parser.expression();

        Assert.NotNull(expression);

        Assert.Equal(1, expression.ChildCount);

        Assert.IsType<TinyCellParser.ExpressionContext>(expression);
    }

    [Fact]
    [Description("Validates the structure of the parse tree for function assignment")]
    public void ParserFunctionAssignmentStructureTest()
    {
        var tokens = new List<IToken>
        {
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("=", TinyCellLexer.ASSIGN),
            new TestToken("foo", TinyCellLexer.Identifier),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var expression = parser.expression();

        Assert.NotNull(expression);

        Assert.Equal(1, expression.ChildCount);

        Assert.IsType<TinyCellParser.ExpressionContext>(expression);
    }

    [Fact]
    [Description("Validates the structure of the parse tree for expression assignment")]
    public void ParserExpressionAssignmentStructureTest()
    {
        var tokens = new List<IToken>
        {
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("=", TinyCellLexer.ASSIGN),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken("+", TinyCellLexer.PLUS),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var expression = parser.expression();

        Assert.NotNull(expression);

        Assert.Equal(1, expression.ChildCount);

        Assert.IsType<TinyCellParser.ExpressionContext>(expression);
    }

    [Fact]
    [Description("Validates the structure of the parse tree for unary expression assignment")]
    public void ParserUnaryExpressionAssignmentStructureTest()
    {
        var tokens = new List<IToken>
        {
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("=", TinyCellLexer.ASSIGN),
            new TestToken("-", TinyCellLexer.MINUS),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var expression = parser.expression();

        Assert.NotNull(expression);

        Assert.Equal(1, expression.ChildCount);

        Assert.IsType<TinyCellParser.ExpressionContext>(expression);
    }

    [Fact]
    [Description("Validates the structure of the parse tree for multiplicative expression assignment")]
    public void ParserMultiplicativeExpressionAssignmentStructureTest()
    {
        var tokens = new List<IToken>
        {
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("=", TinyCellLexer.ASSIGN),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken("*", TinyCellLexer.MULT),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var expression = parser.expression();

        Assert.NotNull(expression);

        Assert.Equal(1, expression.ChildCount);

        Assert.IsType<TinyCellParser.ExpressionContext>(expression);
    }

    [Fact]
    [Description("Validates the structure of the parse tree for additive expression assignment")]
    public void ParserAdditiveExpressionAssignmentStructureTest()
    {
        var tokens = new List<IToken>
        {
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("=", TinyCellLexer.ASSIGN),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken("+", TinyCellLexer.PLUS),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var expression = parser.expression();

        Assert.NotNull(expression);

        Assert.Equal(1, expression.ChildCount);

        Assert.IsType<TinyCellParser.ExpressionContext>(expression);
    }

    [Fact]
    [Description("Validates the structure of the parse tree for bitshift expression assignment")]
    public void ParserBitshiftExpressionAssignmentStructureTest()
    {
        var tokens = new List<IToken>
        {
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("=", TinyCellLexer.ASSIGN),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken("<<", TinyCellLexer.BITSHIFTL),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var expression = parser.expression();

        Assert.NotNull(expression);

        Assert.Equal(1, expression.ChildCount);

        Assert.IsType<TinyCellParser.ExpressionContext>(expression);
    }
}