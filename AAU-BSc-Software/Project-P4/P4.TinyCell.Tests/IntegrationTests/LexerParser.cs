using Antlr4.Runtime;
using System.ComponentModel;

namespace P4.TinyCell.Tests.IntegrationTests;

public class LexerParser
{
    [Fact]
    [Description("If control flow test")]
    public void IfControlTest()
    {
        var input = @"
        setup{
            if (true) {
                print(1);
            }  
        }
        update{}
        ";

        var antlrInputStream = new AntlrInputStream(input);
        var lexer = new TinyCellLexer(antlrInputStream);
        var tokenStream = new CommonTokenStream(lexer);
        var parser = new TinyCellParser(tokenStream);
        tokenStream.Fill();
        var tokens = tokenStream.GetTokens();
        var tree = parser.document();

        var expectedTokenTypes = new List<int>
        {
            TinyCellLexer.Whitespace,
            TinyCellLexer.SETUP,
            TinyCellLexer.LCURLY,
            TinyCellLexer.Whitespace,
            TinyCellLexer.IF,
            TinyCellLexer.Whitespace,
            TinyCellLexer.LPAR,
            TinyCellLexer.Bool,
            TinyCellLexer.RPAR,
            TinyCellLexer.Whitespace,
            TinyCellLexer.LCURLY,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.LPAR,
            TinyCellLexer.IntNumeral,
            TinyCellLexer.RPAR,
            TinyCellLexer.SEMI,
            TinyCellLexer.Whitespace,
            TinyCellLexer.RCURLY,
            TinyCellLexer.Whitespace,
            TinyCellLexer.RCURLY,
            TinyCellLexer.Whitespace,
            TinyCellLexer.UPDATE,
            TinyCellLexer.LCURLY,
            TinyCellLexer.RCURLY,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Eof
        };

        Assert.Equal(expectedTokenTypes, tokens.Select(t => t.Type).ToList());

        Assert.NotNull(tree);

        Assert.Equal(2, tree.ChildCount);

        Assert.Equal("DocumentContext", tree.GetType().Name);
        Assert.IsType<TinyCellParser.SetupDefinitionContext>(tree.GetChild(0));
        Assert.IsType<TinyCellParser.UpdateDefinitionContext>(tree.GetChild(1));

        var setup = tree.GetChild(0);
        Assert.Equal(2, setup.ChildCount);
        Assert.Equal("SetupDefinitionContext", setup.GetType().Name);

        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(setup.GetChild(0));
        Assert.IsType<TinyCellParser.CompoundStatementContext>(setup.GetChild(1));

        var compoundStatement = setup.GetChild(1);
        Assert.Equal(3, compoundStatement.ChildCount);
        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(compoundStatement.GetChild(0));
        Assert.IsType<TinyCellParser.StatementContext>(compoundStatement.GetChild(1));
        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(compoundStatement.GetChild(2));

        var statement = compoundStatement.GetChild(1);
        Assert.Equal(1, statement.ChildCount);
        Assert.IsType<TinyCellParser.IfStatementContext>(statement.GetChild(0));

        var ifStatement = statement.GetChild(0);
        Assert.Equal(5, ifStatement.ChildCount);
        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(ifStatement.GetChild(0));
        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(ifStatement.GetChild(1));
        Assert.IsType<TinyCellParser.ExpressionContext>(ifStatement.GetChild(2));
        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(ifStatement.GetChild(3));
        Assert.IsType<TinyCellParser.CompoundStatementContext>(ifStatement.GetChild(4));

        var update = tree.GetChild(1);
        Assert.Equal(2, update.ChildCount);
        Assert.Equal("UpdateDefinitionContext", update.GetType().Name);
    }

    [Fact]
    [Description("If-else control flow test")]
    public void IfElseControlTest()
    {
        var input = @"
        setup{
            if (true) {
                print(1);
            } else {
                print(2);
            }  
        }
        update{}
        ";

        var antlrInputStream = new AntlrInputStream(input);
        var lexer = new TinyCellLexer(antlrInputStream);
        var tokenStream = new CommonTokenStream(lexer);
        var parser = new TinyCellParser(tokenStream);
        tokenStream.Fill();
        var tokens = tokenStream.GetTokens();
        var tree = parser.document();

        var expectedTokenTypes = new List<int>
        {
            TinyCellLexer.Whitespace,
            TinyCellLexer.SETUP,
            TinyCellLexer.LCURLY,
            TinyCellLexer.Whitespace,
            TinyCellLexer.IF,
            TinyCellLexer.Whitespace,
            TinyCellLexer.LPAR,
            TinyCellLexer.Bool,
            TinyCellLexer.RPAR,
            TinyCellLexer.Whitespace,
            TinyCellLexer.LCURLY,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.LPAR,
            TinyCellLexer.IntNumeral,
            TinyCellLexer.RPAR,
            TinyCellLexer.SEMI,
            TinyCellLexer.Whitespace,
            TinyCellLexer.RCURLY,
            TinyCellLexer.Whitespace,
            TinyCellLexer.ELSE,
            TinyCellLexer.Whitespace,
            TinyCellLexer.LCURLY,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.LPAR,
            TinyCellLexer.IntNumeral,
            TinyCellLexer.RPAR,
            TinyCellLexer.SEMI,
            TinyCellLexer.Whitespace,
            TinyCellLexer.RCURLY,
            TinyCellLexer.Whitespace,
            TinyCellLexer.RCURLY,
            TinyCellLexer.Whitespace,
            TinyCellLexer.UPDATE,
            TinyCellLexer.LCURLY,
            TinyCellLexer.RCURLY,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Eof
        };

        Assert.Equal(expectedTokenTypes, tokens.Select(t => t.Type).ToList());

        Assert.NotNull(tree);

        Assert.Equal(2, tree.ChildCount);

        Assert.Equal("DocumentContext", tree.GetType().Name);
        Assert.IsType<TinyCellParser.SetupDefinitionContext>(tree.GetChild(0));
        Assert.IsType<TinyCellParser.UpdateDefinitionContext>(tree.GetChild(1));

        var setup = tree.GetChild(0);
        Assert.Equal(2, setup.ChildCount);
        Assert.Equal("SetupDefinitionContext", setup.GetType().Name);

        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(setup.GetChild(0));
        Assert.IsType<TinyCellParser.CompoundStatementContext>(setup.GetChild(1));

        var compoundStatement = setup.GetChild(1);
        Assert.Equal(3, compoundStatement.ChildCount);
        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(compoundStatement.GetChild(0));
        Assert.IsType<TinyCellParser.StatementContext>(compoundStatement.GetChild(1));
        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(compoundStatement.GetChild(2));

        var statement = compoundStatement.GetChild(1);
        Assert.Equal(1, statement.ChildCount);
        Assert.IsType<TinyCellParser.IfStatementContext>(statement.GetChild(0));

        var ifStatement = statement.GetChild(0);
        Assert.Equal(7, ifStatement.ChildCount);
        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(ifStatement.GetChild(0));
        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(ifStatement.GetChild(1));
        Assert.IsType<TinyCellParser.ExpressionContext>(ifStatement.GetChild(2));
        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(ifStatement.GetChild(3));
        Assert.IsType<TinyCellParser.CompoundStatementContext>(ifStatement.GetChild(4));
        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(ifStatement.GetChild(5));
        Assert.IsType<TinyCellParser.CompoundStatementContext>(ifStatement.GetChild(6));

        var update = tree.GetChild(1);
        Assert.Equal(2, update.ChildCount);
        Assert.Equal("UpdateDefinitionContext", update.GetType().Name);
    }

    [Fact]
    [Description("For loop control flow test")]
    public void ForLoopControlTest()
    {
        var input = @"
        setup{
            for (int i = 0; i < 10; i = i + 1) {
                print(i);
            }  
        }
        update{}
        ";

        var antlrInputStream = new AntlrInputStream(input);
        var lexer = new TinyCellLexer(antlrInputStream);
        var tokenStream = new CommonTokenStream(lexer);
        var parser = new TinyCellParser(tokenStream);
        tokenStream.Fill();
        var tokens = tokenStream.GetTokens();
        var tree = parser.document();

        var expectedTokenTypes = new List<int>
        {
            TinyCellLexer.Whitespace,
            TinyCellLexer.SETUP,
            TinyCellLexer.LCURLY,
            TinyCellLexer.Whitespace,
            TinyCellLexer.FOR,
            TinyCellLexer.Whitespace,
            TinyCellLexer.LPAR,
            TinyCellLexer.INT,
            TinyCellLexer.Whitespace,
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
            TinyCellLexer.LPAR,
            TinyCellLexer.Identifier,
            TinyCellLexer.RPAR,
            TinyCellLexer.SEMI,
            TinyCellLexer.Whitespace,
            TinyCellLexer.RCURLY,
            TinyCellLexer.Whitespace,
            TinyCellLexer.RCURLY,
            TinyCellLexer.Whitespace,
            TinyCellLexer.UPDATE,
            TinyCellLexer.LCURLY,
            TinyCellLexer.RCURLY,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Eof
        };

        Assert.Equal(expectedTokenTypes, tokens.Select(t => t.Type).ToList());

        Assert.NotNull(tree);

        Assert.Equal(2, tree.ChildCount);

        Assert.Equal("DocumentContext", tree.GetType().Name);
        Assert.IsType<TinyCellParser.SetupDefinitionContext>(tree.GetChild(0));
        Assert.IsType<TinyCellParser.UpdateDefinitionContext>(tree.GetChild(1));

        var setup = tree.GetChild(0);
        Assert.Equal(2, setup.ChildCount);
        Assert.Equal("SetupDefinitionContext", setup.GetType().Name);

        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(setup.GetChild(0));
        Assert.IsType<TinyCellParser.CompoundStatementContext>(setup.GetChild(1));

        var compoundStatement = setup.GetChild(1);
        Assert.Equal(3, compoundStatement.ChildCount);
        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(compoundStatement.GetChild(0));
        Assert.IsType<TinyCellParser.StatementContext>(compoundStatement.GetChild(1));
        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(compoundStatement.GetChild(2));

        var statement = compoundStatement.GetChild(1);
        Assert.Equal(1, statement.ChildCount);
        Assert.IsType<TinyCellParser.LoopStatementContext>(statement.GetChild(0));

        var loopStatement = statement.GetChild(0);
        Assert.Equal(9, loopStatement.ChildCount);
        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(loopStatement.GetChild(0));
        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(loopStatement.GetChild(1));
        Assert.IsType<TinyCellParser.DeclarationContext>(loopStatement.GetChild(2));
        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(loopStatement.GetChild(3));
        Assert.IsType<TinyCellParser.ExpressionContext>(loopStatement.GetChild(4));
        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(loopStatement.GetChild(5));
        Assert.IsType<TinyCellParser.AssignmentContext>(loopStatement.GetChild(6));
        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(loopStatement.GetChild(7));
        Assert.IsType<TinyCellParser.CompoundStatementContext>(loopStatement.GetChild(8));

        var update = tree.GetChild(1);
        Assert.Equal(2, update.ChildCount);
        Assert.Equal("UpdateDefinitionContext", update.GetType().Name);
    }

    [Fact]
    [Description("While loop control flow test")]
    public void WhileLoopControlTest()
    {
        var input = @"
        setup{
            while (true) {
                print(1);
            }  
        }
        update{}
        ";

        var antlrInputStream = new AntlrInputStream(input);
        var lexer = new TinyCellLexer(antlrInputStream);
        var tokenStream = new CommonTokenStream(lexer);
        var parser = new TinyCellParser(tokenStream);
        tokenStream.Fill();
        var tokens = tokenStream.GetTokens();
        var tree = parser.document();

        var expectedTokenTypes = new List<int>
        {
            TinyCellLexer.Whitespace,
            TinyCellLexer.SETUP,
            TinyCellLexer.LCURLY,
            TinyCellLexer.Whitespace,
            TinyCellLexer.WHILE,
            TinyCellLexer.Whitespace,
            TinyCellLexer.LPAR,
            TinyCellLexer.Bool,
            TinyCellLexer.RPAR,
            TinyCellLexer.Whitespace,
            TinyCellLexer.LCURLY,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.LPAR,
            TinyCellLexer.IntNumeral,
            TinyCellLexer.RPAR,
            TinyCellLexer.SEMI,
            TinyCellLexer.Whitespace,
            TinyCellLexer.RCURLY,
            TinyCellLexer.Whitespace,
            TinyCellLexer.RCURLY,
            TinyCellLexer.Whitespace,
            TinyCellLexer.UPDATE,
            TinyCellLexer.LCURLY,
            TinyCellLexer.RCURLY,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Eof
        };

        Assert.Equal(expectedTokenTypes, tokens.Select(t => t.Type).ToList());

        Assert.NotNull(tree);

        Assert.Equal(2, tree.ChildCount);

        Assert.Equal("DocumentContext", tree.GetType().Name);
        Assert.IsType<TinyCellParser.SetupDefinitionContext>(tree.GetChild(0));
        Assert.IsType<TinyCellParser.UpdateDefinitionContext>(tree.GetChild(1));

        var setup = tree.GetChild(0);
        Assert.Equal(2, setup.ChildCount);
        Assert.Equal("SetupDefinitionContext", setup.GetType().Name);

        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(setup.GetChild(0));
        Assert.IsType<TinyCellParser.CompoundStatementContext>(setup.GetChild(1));

        var compoundStatement = setup.GetChild(1);
        Assert.Equal(3, compoundStatement.ChildCount);
        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(compoundStatement.GetChild(0));
        Assert.IsType<TinyCellParser.StatementContext>(compoundStatement.GetChild(1));
        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(compoundStatement.GetChild(2));

        var statement = compoundStatement.GetChild(1);
        Assert.Equal(1, statement.ChildCount);
        Assert.IsType<TinyCellParser.LoopStatementContext>(statement.GetChild(0));

        var loopStatement = statement.GetChild(0);
        Assert.Equal(5, loopStatement.ChildCount);
        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(loopStatement.GetChild(0));
        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(loopStatement.GetChild(1));
        Assert.IsType<TinyCellParser.ExpressionContext>(loopStatement.GetChild(2));
        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(loopStatement.GetChild(3));
        Assert.IsType<TinyCellParser.CompoundStatementContext>(loopStatement.GetChild(4));

        var update = tree.GetChild(1);
        Assert.Equal(2, update.ChildCount);
        Assert.Equal("UpdateDefinitionContext", update.GetType().Name);
    }

    [Fact]
    [Description("Function call control flow test")]
    public void FunctionCallControlTest()
    {
        var input = @"
        setup{
            print(1);
        }
        update{}
        ";

        var antlrInputStream = new AntlrInputStream(input);
        var lexer = new TinyCellLexer(antlrInputStream);
        var tokenStream = new CommonTokenStream(lexer);
        var parser = new TinyCellParser(tokenStream);
        tokenStream.Fill();
        var tokens = tokenStream.GetTokens();
        var tree = parser.document();

        var expectedTokenTypes = new List<int>
        {
            TinyCellLexer.Whitespace,
            TinyCellLexer.SETUP,
            TinyCellLexer.LCURLY,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Identifier,
            TinyCellLexer.LPAR,
            TinyCellLexer.IntNumeral,
            TinyCellLexer.RPAR,
            TinyCellLexer.SEMI,
            TinyCellLexer.Whitespace,
            TinyCellLexer.RCURLY,
            TinyCellLexer.Whitespace,
            TinyCellLexer.UPDATE,
            TinyCellLexer.LCURLY,
            TinyCellLexer.RCURLY,
            TinyCellLexer.Whitespace,
            TinyCellLexer.Eof
        };

        Assert.Equal(expectedTokenTypes, tokens.Select(t => t.Type).ToList());

        Assert.NotNull(tree);

        Assert.Equal(2, tree.ChildCount);

        Assert.Equal("DocumentContext", tree.GetType().Name);
        Assert.IsType<TinyCellParser.SetupDefinitionContext>(tree.GetChild(0));
        Assert.IsType<TinyCellParser.UpdateDefinitionContext>(tree.GetChild(1));

        var setup = tree.GetChild(0);
        Assert.Equal(2, setup.ChildCount);
        Assert.Equal("SetupDefinitionContext", setup.GetType().Name);

        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(setup.GetChild(0));
        Assert.IsType<TinyCellParser.CompoundStatementContext>(setup.GetChild(1));

        var compoundStatement = setup.GetChild(1);
        Assert.Equal(3, compoundStatement.ChildCount);
        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(compoundStatement.GetChild(0));
        Assert.IsType<TinyCellParser.StatementContext>(compoundStatement.GetChild(1));
        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(compoundStatement.GetChild(2));

        var statement = compoundStatement.GetChild(1);
        Assert.Equal(2, statement.ChildCount);
        Assert.IsType<TinyCellParser.FunctionCallContext>(statement.GetChild(0));
        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(statement.GetChild(1));

        var functionCall = statement.GetChild(0);
        Assert.Equal(4, functionCall.ChildCount);
        Assert.IsType<TinyCellParser.IdentifierContext>(functionCall.GetChild(0));
        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(functionCall.GetChild(1));
        Assert.IsType<TinyCellParser.ArgumentListContext>(functionCall.GetChild(2));
        Assert.IsType<Antlr4.Runtime.Tree.TerminalNodeImpl>(functionCall.GetChild(3));

        var update = tree.GetChild(1);
        Assert.Equal(2, update.ChildCount);
        Assert.Equal("UpdateDefinitionContext", update.GetType().Name);
    }
}