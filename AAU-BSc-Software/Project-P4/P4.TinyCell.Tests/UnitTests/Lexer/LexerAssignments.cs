using static P4.TinyCell.Tests.Utility;
using System.ComponentModel;

namespace P4.TinyCell.Tests.UnitTests.Lexer;

public class LexerAssignments
{
    [Fact]
    [Description("Can handle a numeral assignment")]
    public void LexerNumeralAssignment()
    {
        var input = "x = 5";
        var tokenTypes = GetTokenTypesFromInput(input);

        var expectedTokenTypes = new List<int>
        {
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.ASSIGN,
            TinyCellLexer.Whitespace,
            TinyCellLexer.IntNumeral,
            TinyCellLexer.Eof
        };

        Assert.Equal(expectedTokenTypes, tokenTypes);
    }


    [Fact]
    [Description("Can handle a string assignment")]
    public void LexerStringAssignment()
    {
        var input = "x = \"hello\"";
        var tokenTypes = GetTokenTypesFromInput(input);

        var expectedTokenTypes = new List<int>
        {
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.ASSIGN,
            TinyCellLexer.Whitespace,
            TinyCellLexer.String,
            TinyCellLexer.Eof
        };

        Assert.Equal(expectedTokenTypes, tokenTypes);
    }


    [Fact]
    [Description("Can handle a boolean assignment")]
    public void LexerBooleanAssignment()
    {
        var input = "x = true";
        var tokenTypes = GetTokenTypesFromInput(input);

        var expectedTokenTypes = new List<int>
        {
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.ASSIGN,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Bool,
            TinyCellLexer.Eof
        };

        Assert.Equal(expectedTokenTypes, tokenTypes);
    }


    [Fact]
    [Description("Can handle a function assignment")]
    public void LexerFunctionAssignment()
    {
        var input = "x = func()";
        var tokenTypes = GetTokenTypesFromInput(input);

        var expectedTokenTypes = new List<int>
        {
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.ASSIGN,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.LPAR,
            TinyCellLexer.RPAR,
            TinyCellLexer.Eof
        };

        Assert.Equal(expectedTokenTypes, tokenTypes);
    }


    [Fact]
    [Description("Can handle an expression assignment")]
    public void LexerExpressionAssignment()
    {
        var input = "x = 5 + 5";
        var tokenTypes = GetTokenTypesFromInput(input);

        var expectedTokenTypes = new List<int>
        {
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.ASSIGN,
            TinyCellLexer.Whitespace,
            TinyCellLexer.IntNumeral,
            TinyCellLexer.Whitespace,
            TinyCellLexer.PLUS,
            TinyCellLexer.Whitespace,
            TinyCellLexer.IntNumeral,
            TinyCellLexer.Eof
        };

        Assert.Equal(expectedTokenTypes, tokenTypes);
    }


    [Fact]
    [Description("Can handle a unary expression assignment")]
    public void LexerUnaryExpressionAssignment()
    {
        var input = "x = -5";
        var tokenTypes = GetTokenTypesFromInput(input);

        var expectedTokenTypes = new List<int>
        {
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.ASSIGN,
            TinyCellLexer.Whitespace,
            TinyCellLexer.MINUS,
            TinyCellLexer.IntNumeral,
            TinyCellLexer.Eof
        };

        Assert.Equal(expectedTokenTypes, tokenTypes);
    }


    [Fact]
    [Description("Can handle a multiplicative expression assignment")]
    public void LexerMultiplicativeExpressionAssignment()
    {
        var input = "x = 5 * 5";
        var tokenTypes = GetTokenTypesFromInput(input);

        var expectedTokenTypes = new List<int>
        {
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.ASSIGN,
            TinyCellLexer.Whitespace,
            TinyCellLexer.IntNumeral,
            TinyCellLexer.Whitespace,
            TinyCellLexer.MULT,
            TinyCellLexer.Whitespace,
            TinyCellLexer.IntNumeral,
            TinyCellLexer.Eof
        };

        Assert.Equal(expectedTokenTypes, tokenTypes);
    }


    [Fact]
    [Description("Can handle additive expression assignment")]
    public void LexerAdditiveExpressionAssignment()
    {
        var input = "x = 5 + 5";
        var tokenTypes = GetTokenTypesFromInput(input);

        var expectedTokenTypes = new List<int>
        {
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.ASSIGN,
            TinyCellLexer.Whitespace,
            TinyCellLexer.IntNumeral,
            TinyCellLexer.Whitespace,
            TinyCellLexer.PLUS,
            TinyCellLexer.Whitespace,
            TinyCellLexer.IntNumeral,
            TinyCellLexer.Eof
        };

        Assert.Equal(expectedTokenTypes, tokenTypes);
    }


    [Fact]
    [Description("Can handle bitshift expression assignment")]
    public void LexerBitshiftExpressionAssignment()
    {
        var input = "x = 5 << 5";
        var tokenTypes = GetTokenTypesFromInput(input);

        var expectedTokenTypes = new List<int>
        {
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.ASSIGN,
            TinyCellLexer.Whitespace,
            TinyCellLexer.IntNumeral,
            TinyCellLexer.Whitespace,
            TinyCellLexer.BITSHIFTL,
            TinyCellLexer.Whitespace,
            TinyCellLexer.IntNumeral,
            TinyCellLexer.Eof
        };

        Assert.Equal(expectedTokenTypes, tokenTypes);
    }


    [Fact]
    [Description("Can handle float expression assignment with floats")]
    public void LexerFloatExpressionAssignment()
    {
        var input = "x = 5.5 + 5.5";
        var tokenTypes = GetTokenTypesFromInput(input);

        var expectedTokenTypes = new List<int>
        {
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.ASSIGN,
            TinyCellLexer.Whitespace,
            TinyCellLexer.FloatNumeral,
            TinyCellLexer.Whitespace,
            TinyCellLexer.PLUS,
            TinyCellLexer.Whitespace,
            TinyCellLexer.FloatNumeral,
            TinyCellLexer.Eof
        };

        Assert.Equal(expectedTokenTypes, tokenTypes);
    }
}