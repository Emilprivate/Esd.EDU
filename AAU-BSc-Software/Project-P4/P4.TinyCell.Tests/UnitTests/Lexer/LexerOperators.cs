using System.ComponentModel;
using static P4.TinyCell.Tests.Utility;

namespace P4.TinyCell.Tests.UnitTests.Lexer;

public class LexerOperators
{
    [Fact]
    [Description("Can handle arithmetic operators")]
    public void LexerArithmeticOperators()
    {
        var input = "x = y + z * a / b - c;";
        var tokenTypes = GetTokenTypesFromInput(input);

        var expectedTokenTypes = new List<int>
        {
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.ASSIGN,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.PLUS,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.MULT,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.DIV,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.MINUS,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.SEMI,
            TinyCellLexer.Eof
        };

        Assert.Equal(expectedTokenTypes, tokenTypes);
    }


    [Fact]
    [Description("Can handle comparison operators")]
    public void LexerComparisonOperators()
    {
        var input = "x = y == z != a < b > c <= d >= e;";
        var tokenTypes = GetTokenTypesFromInput(input);

        var expectedTokenTypes = new List<int>
        {
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.ASSIGN,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.EQ,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.NEQ,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.LT,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.GT,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.LTE,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.GTE,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.SEMI,
            TinyCellLexer.Eof
        };

        Assert.Equal(expectedTokenTypes, tokenTypes);
    }


    [Fact]
    [Description("Can handle assignment operators")]
    public void LexerAssignmentOperators()
    {
        var input = "x = y += z -= a *= b /= c %= p;";
        var tokenTypes = GetTokenTypesFromInput(input);

        var expectedTokenTypes = new List<int>
        {
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.ASSIGN,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.PLUSASSIGN,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.MINUSASSIGN,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.MULTASSIGN,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.DIVASSIGN,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.Whitespace,
            TinyCellLexer.MODASSIGN,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.SEMI,
            TinyCellLexer.Eof
        };

        Assert.Equal(expectedTokenTypes, tokenTypes);
    }
}