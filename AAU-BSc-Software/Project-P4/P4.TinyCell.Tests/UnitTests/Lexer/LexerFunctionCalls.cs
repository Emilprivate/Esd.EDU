using System.ComponentModel;
using static P4.TinyCell.Tests.Utility;

namespace P4.TinyCell.Tests.UnitTests.Lexer;

public class LexerFunctionCalls
{
    [Fact]
    [Description("Can handle function calls")]
    public void LexerFunctionCall()
    {
        var input = "foo();";
        var tokenTypes = GetTokenTypesFromInput(input);

        var expectedTokenTypes = new List<int>
        {
            TinyCellLexer.Identifier,
            TinyCellLexer.LPAR,
            TinyCellLexer.RPAR,
            TinyCellLexer.SEMI,
            TinyCellLexer.Eof
        };

        Assert.Equal(expectedTokenTypes, tokenTypes);
    }


    [Fact]
    [Description("Can handle function calls with arguments")]
    public void LexerFunctionCallWithArguments()
    {
        var input = "foo(5);";
        var tokenTypes = GetTokenTypesFromInput(input);

        var expectedTokenTypes = new List<int>
        {
            TinyCellLexer.Identifier,
            TinyCellLexer.LPAR,
            TinyCellLexer.IntNumeral,
            TinyCellLexer.RPAR,
            TinyCellLexer.SEMI,
            TinyCellLexer.Eof
        };

        Assert.Equal(expectedTokenTypes, tokenTypes);
    }
}