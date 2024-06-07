using Antlr4.Runtime;
using System.ComponentModel;
using static P4.TinyCell.Tests.Utility;

namespace P4.TinyCell.Tests.UnitTests.Parser;

public class ParserErrorHandling
{
    [Fact]
    [Description("Can handle syntax error in assignment statement")]
    public void ParserAssignmentSyntaxError()
    {
        var tokens = new List<IToken>
        {
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken("", TinyCellLexer.Eof)
        };

        bool syntaxErrorCaught = false;

        try
        {
            var parser = CreateParserNoError(tokens);
            var expression = parser.assignment();
        }
        catch (Exception ex)
        {
            syntaxErrorCaught = true;
            Assert.Contains("Syntax error", ex.Message);
        }

        Assert.True(syntaxErrorCaught);
    }

    [Fact]
    [Description("Can handle syntax error in if statement")]
    public void ParserIfSyntaxError()
    {
        var tokens = new List<IToken>
        {
            new TestToken("if", TinyCellLexer.IF),
            new TestToken("(", TinyCellLexer.LPAR),
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("=", TinyCellLexer.ASSIGN),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken(")", TinyCellLexer.RPAR),
            new TestToken("{", TinyCellLexer.LCURLY),
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("=", TinyCellLexer.ASSIGN),
            new TestToken("6", TinyCellLexer.IntNumeral),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("}", TinyCellLexer.RCURLY),
            new TestToken("", TinyCellLexer.Eof)
        };

        bool syntaxErrorCaught = false;

        try
        {
            var parser = CreateParserNoError(tokens);
            var expression = parser.ifStatement();
        }
        catch (Exception ex)
        {
            syntaxErrorCaught = true;
            Assert.Contains("Syntax error", ex.Message);
        }

        Assert.True(syntaxErrorCaught);
    }

    [Fact]
    [Description("Can handle syntax error in function call")]
    public void ParserFunctionCallSyntaxError()
    {
        var tokens = new List<IToken>
        {
            new TestToken("foo", TinyCellLexer.Identifier),
            new TestToken("(", TinyCellLexer.LPAR),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("", TinyCellLexer.Eof)
        };

        bool syntaxErrorCaught = false;

        try
        {
            var parser = CreateParserNoError(tokens);
            var expression = parser.functionCall();
        }
        catch (Exception ex)
        {
            syntaxErrorCaught = true;
            Assert.Contains("Syntax error", ex.Message);
        }

        Assert.True(syntaxErrorCaught);
    }

    [Fact]
    [Description("Can handle syntax error in while statement")]
    public void ParserWhileSyntaxError()
    {
        var tokens = new List<IToken>
        {
            new TestToken("while", TinyCellLexer.WHILE),
            new TestToken("(", TinyCellLexer.LPAR),
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("=", TinyCellLexer.ASSIGN),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken(")", TinyCellLexer.RPAR),
            new TestToken("{", TinyCellLexer.LCURLY),
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("=", TinyCellLexer.ASSIGN),
            new TestToken("6", TinyCellLexer.IntNumeral),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("}", TinyCellLexer.RCURLY),
            new TestToken("", TinyCellLexer.Eof)
        };

        bool syntaxErrorCaught = false;

        try
        {
            var parser = CreateParserNoError(tokens);
            var expression = parser.loopStatement();
        }
        catch (Exception ex)
        {
            syntaxErrorCaught = true;
            Assert.Contains("Syntax error", ex.Message);
        }

        Assert.True(syntaxErrorCaught);
    }

    [Fact]
    [Description("Can handle syntax error in for statement")]
    public void ParserForSyntaxError()
    {
        var tokens = new List<IToken>
        {
            new TestToken("for", TinyCellLexer.FOR),
            new TestToken("(", TinyCellLexer.LPAR),
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("=", TinyCellLexer.ASSIGN),
            new TestToken("5", TinyCellLexer.IntNumeral),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("<", TinyCellLexer.LT),
            new TestToken("10", TinyCellLexer.IntNumeral),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("=", TinyCellLexer.ASSIGN),
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("+", TinyCellLexer.PLUS),
            new TestToken("1", TinyCellLexer.IntNumeral),
            new TestToken(")", TinyCellLexer.RPAR),
            new TestToken("{", TinyCellLexer.LCURLY),
            new TestToken("x", TinyCellLexer.Identifier),
            new TestToken("=", TinyCellLexer.ASSIGN),
            new TestToken("6", TinyCellLexer.IntNumeral),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("}", TinyCellLexer.RCURLY),
            new TestToken("", TinyCellLexer.Eof)
        };

        bool syntaxErrorCaught = false;

        try
        {
            var parser = CreateParserNoError(tokens);
            var expression = parser.loopStatement();
        }
        catch (Exception ex)
        {
            syntaxErrorCaught = true;
            Assert.Contains("Syntax error", ex.Message);
        }

        Assert.True(syntaxErrorCaught);
    }
}