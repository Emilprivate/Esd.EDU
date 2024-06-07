using Antlr4.Runtime;
using Antlr4.Runtime.Atn;
using Antlr4.Runtime.Dfa;
using Antlr4.Runtime.Sharpen;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree;
using P4.TinyCell.Shared.Language.CodeGen;
using P4.TinyCell.Shared.Language.Typechecking;
using P4.TinyCell.Shared.Utilities;
using Xunit;

namespace P4.TinyCell.Tests;

public static class Utility
{
    #region Token Utilities

    public static List<int> GetTokenTypesFromInput(string input)
    {
        var antlrInputStream = new AntlrInputStream(input);
        var lexer = new TinyCellLexer(antlrInputStream);
        var tokenStream = new CommonTokenStream(lexer);
        tokenStream.Fill();
        var tokens = tokenStream.GetTokens();

        return tokens.Select(token => token.Type).ToList();
    }

    public static TinyCellParser CreateParserNoError(List<IToken> tokens)
    {
        var tokenStream = new CommonTokenStream(new ListTokenSource(tokens));
        var parser = new TinyCellParser(tokenStream);
        parser.AddErrorListener(new NoErrorListener());
        return parser;
    }

    #endregion

    #region Custom Token and Error Listener

    public class TestToken : IToken
    {
        private readonly string _text;
        private readonly int _type;

        public TestToken(string text, int type)
        {
            _text = text;
            _type = type;
        }

        public string Text => _text;
        public int Type => _type;
        public int Line => 0;
        public int CharPositionInLine => 0;
        public int Channel => 0;
        public int TokenIndex => 0;
        public int StartIndex => 0;
        public int StopIndex => 0;
        public ITokenSource TokenSource => null;
        public ICharStream InputStream => null;
        int IToken.Column => 0;
    }

    public class NoErrorListener : BaseErrorListener
    {
        public override void SyntaxError(TextWriter output, IRecognizer recognizer, IToken offendingSymbol, int line,
            int charPositionInLine, string msg, RecognitionException e)
        {
            Assert.Fail($"Syntax error at line {line}:{charPositionInLine} at {offendingSymbol.Text}");
        }

        public override void ReportAmbiguity(Parser recognizer, DFA dfa, int startIndex, int stopIndex, bool exact,
            BitSet ambigAlts, ATNConfigSet configs)
        {
            Assert.Fail($"Ambiguity at {startIndex}:{stopIndex}");
        }

        public override void ReportAttemptingFullContext(Parser recognizer, DFA dfa, int startIndex, int stopIndex,
            BitSet conflictingAlts, ATNConfigSet configs)
        {
            Assert.Fail($"Attempting full context at {startIndex}:{stopIndex}");
        }

        public override void ReportContextSensitivity(Parser recognizer, DFA dfa, int startIndex, int stopIndex,
            int prediction, ATNConfigSet configs)
        {
            Assert.Fail($"Context sensitivity at {startIndex}:{stopIndex}");
        }
    }

    #endregion

    #region Typechecking Utility

    public static Exception? CheckTypeErrors(string testCode)
    {
        var antlrInputStream = new AntlrInputStream(testCode);
        var lexer = new TinyCellLexer(antlrInputStream);
        var tokenStream = new CommonTokenStream(lexer);
        var parser = new TinyCellParser(tokenStream);
        parser.AddErrorListener(new NoErrorListener());
        var tree = parser.document();

        var astBuilderVisitor = new AstBuilderVisitor();
        var ast = astBuilderVisitor.Visit(tree);

        var typeChecker = new TypeCheckerVisitor();
        return Record.Exception(() => typeChecker.Visit(ast));
    }

    #endregion
}