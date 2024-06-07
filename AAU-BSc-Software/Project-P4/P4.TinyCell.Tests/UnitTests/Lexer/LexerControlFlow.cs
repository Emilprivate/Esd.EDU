using System.ComponentModel;
using static P4.TinyCell.Tests.Utility;

namespace P4.TinyCell.Tests.UnitTests.Lexer;

public class LexerControlFlow
{
    [Fact]
    [Description("Can handle if statements")]
    public void LexerIfStatement()
    {
        var input = "if (x == 5) { x = 6; }";
        var tokenTypes = GetTokenTypesFromInput(input);

        var expectedTokenTypes = new List<int>
        {
            TinyCellLexer.IF,
            TinyCellLexer.Whitespace,
            TinyCellLexer.LPAR,
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.EQ,
            TinyCellLexer.Whitespace,
            TinyCellLexer.IntNumeral,
            TinyCellLexer.RPAR,
            TinyCellLexer.Whitespace,
            TinyCellLexer.LCURLY,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.ASSIGN,
            TinyCellLexer.Whitespace,
            TinyCellLexer.IntNumeral,
            TinyCellLexer.SEMI,
            TinyCellLexer.Whitespace,
            TinyCellLexer.RCURLY,
            TinyCellLexer.Eof
        };

        Assert.Equal(expectedTokenTypes, tokenTypes);
    }


    [Fact]
    [Description("Can handle if-else statements")]
    public void LexerIfElseStatement()
    {
        var input = "if (x == 5) { x = 6; } else { x = 7; }";
        var tokenTypes = GetTokenTypesFromInput(input);

        var expectedTokenTypes = new List<int>
        {
            TinyCellLexer.IF,
            TinyCellLexer.Whitespace,
            TinyCellLexer.LPAR,
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.EQ,
            TinyCellLexer.Whitespace,
            TinyCellLexer.IntNumeral,
            TinyCellLexer.RPAR,
            TinyCellLexer.Whitespace,
            TinyCellLexer.LCURLY,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.ASSIGN,
            TinyCellLexer.Whitespace,
            TinyCellLexer.IntNumeral,
            TinyCellLexer.SEMI,
            TinyCellLexer.Whitespace,
            TinyCellLexer.RCURLY,
            TinyCellLexer.Whitespace,
            TinyCellLexer.ELSE,
            TinyCellLexer.Whitespace,
            TinyCellLexer.LCURLY,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.ASSIGN,
            TinyCellLexer.Whitespace,
            TinyCellLexer.IntNumeral,
            TinyCellLexer.SEMI,
            TinyCellLexer.Whitespace,
            TinyCellLexer.RCURLY,
            TinyCellLexer.Eof
        };

        Assert.Equal(expectedTokenTypes, tokenTypes);
    }


    [Fact]
    [Description("Can handle while statements")]
    public void LexerWhileStatement()
    {
        var input = "while (x == 5) { x = 6; }";
        var tokenTypes = GetTokenTypesFromInput(input);

        var expectedTokenTypes = new List<int>
        {
            TinyCellLexer.WHILE,
            TinyCellLexer.Whitespace,
            TinyCellLexer.LPAR,
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.EQ,
            TinyCellLexer.Whitespace,
            TinyCellLexer.IntNumeral,
            TinyCellLexer.RPAR,
            TinyCellLexer.Whitespace,
            TinyCellLexer.LCURLY,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.ASSIGN,
            TinyCellLexer.Whitespace,
            TinyCellLexer.IntNumeral,
            TinyCellLexer.SEMI,
            TinyCellLexer.Whitespace,
            TinyCellLexer.RCURLY,
            TinyCellLexer.Eof
        };

        Assert.Equal(expectedTokenTypes, tokenTypes);
    }


    [Fact]
    [Description("Can handle for statements")]
    public void LexerForStatement()
    {
        var input = "for (x = 0; x < 5; x = x + 1) { x = 6; }";
        var tokenTypes = GetTokenTypesFromInput(input);

        var expectedTokenTypes = new List<int>
        {
            TinyCellLexer.FOR,
            TinyCellLexer.Whitespace,
            TinyCellLexer.LPAR,
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.ASSIGN,
            TinyCellLexer.Whitespace,
            TinyCellLexer.IntNumeral,
            TinyCellLexer.SEMI,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.LT,
            TinyCellLexer.Whitespace,
            TinyCellLexer.IntNumeral,
            TinyCellLexer.SEMI,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.ASSIGN,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.PLUS,
            TinyCellLexer.Whitespace,
            TinyCellLexer.IntNumeral,
            TinyCellLexer.RPAR,
            TinyCellLexer.Whitespace,
            TinyCellLexer.LCURLY,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.ASSIGN,
            TinyCellLexer.Whitespace,
            TinyCellLexer.IntNumeral,
            TinyCellLexer.SEMI,
            TinyCellLexer.Whitespace,
            TinyCellLexer.RCURLY,
            TinyCellLexer.Eof
        };

        Assert.Equal(expectedTokenTypes, tokenTypes);
    }
}