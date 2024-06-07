using Antlr4.Runtime;
using System.ComponentModel;
using static P4.TinyCell.Tests.Utility;

namespace P4.TinyCell.Tests.UnitTests.Parser;

public class ParserRules
{
    [Fact]
    [Description("Can parse based on the document rule")]
    public void ParserDocumentRule()
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

        Assert.Equal(TinyCellParser.RULE_setupDefinition, doc.setupDefinition().RuleIndex);
        Assert.Equal(TinyCellParser.RULE_updateDefinition, doc.updateDefinition().RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the generalDeclaration rule")]
    public void ParserGeneralDeclarationRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("int", TinyCellLexer.INT),
            new TestToken("myVar", TinyCellLexer.Identifier),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("void", TinyCellLexer.VOID),
            new TestToken("myFunc", TinyCellLexer.Identifier),
            new TestToken("(", TinyCellLexer.LPAR),
            new TestToken("int", TinyCellLexer.INT),
            new TestToken("param1", TinyCellLexer.Identifier),
            new TestToken(",", TinyCellLexer.COMMA),
            new TestToken("int", TinyCellLexer.INT),
            new TestToken("param2", TinyCellLexer.Identifier),
            new TestToken(")", TinyCellLexer.RPAR),
            new TestToken("{", TinyCellLexer.LCURLY),
            new TestToken("}", TinyCellLexer.RCURLY),
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

        Assert.Equal(4, doc.ChildCount);

        Assert.Equal(TinyCellParser.RULE_generalDeclaration, doc.generalDeclaration(0).RuleIndex);
        Assert.Equal(TinyCellParser.RULE_generalDeclaration, doc.generalDeclaration(1).RuleIndex);
        Assert.Equal(TinyCellParser.RULE_setupDefinition, doc.setupDefinition().RuleIndex);
        Assert.Equal(TinyCellParser.RULE_updateDefinition, doc.updateDefinition().RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the setupDefinition rule")]
    public void ParserSetupDefinitionRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("setup", TinyCellLexer.SETUP),
            new TestToken("{", TinyCellLexer.LCURLY),
            new TestToken("int", TinyCellLexer.INT),
            new TestToken("myVar", TinyCellLexer.Identifier),
            new TestToken(";", TinyCellLexer.SEMI),
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

        Assert.Equal(TinyCellParser.RULE_setupDefinition, doc.setupDefinition().RuleIndex);
        Assert.Equal(TinyCellParser.RULE_updateDefinition, doc.updateDefinition().RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the updateDefinition rule")]
    public void ParserUpdateDefinitionRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("setup", TinyCellLexer.SETUP),
            new TestToken("{", TinyCellLexer.LCURLY),
            new TestToken("}", TinyCellLexer.RCURLY),
            new TestToken("update", TinyCellLexer.UPDATE),
            new TestToken("{", TinyCellLexer.LCURLY),
            new TestToken("int", TinyCellLexer.INT),
            new TestToken("myVar", TinyCellLexer.Identifier),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("}", TinyCellLexer.RCURLY),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var doc = parser.document();

        Assert.NotNull(doc);

        Assert.Equal(2, doc.ChildCount);

        Assert.Equal(TinyCellParser.RULE_setupDefinition, doc.setupDefinition().RuleIndex);
        Assert.Equal(TinyCellParser.RULE_updateDefinition, doc.updateDefinition().RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the functionDefinition rule")]
    public void ParserFunctionDefinitionRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("void", TinyCellLexer.VOID),
            new TestToken("myFunc", TinyCellLexer.Identifier),
            new TestToken("(", TinyCellLexer.LPAR),
            new TestToken("int", TinyCellLexer.INT),
            new TestToken("param1", TinyCellLexer.Identifier),
            new TestToken(",", TinyCellLexer.COMMA),
            new TestToken("int", TinyCellLexer.INT),
            new TestToken("param2", TinyCellLexer.Identifier),
            new TestToken(")", TinyCellLexer.RPAR),
            new TestToken("{", TinyCellLexer.LCURLY),
            new TestToken("}", TinyCellLexer.RCURLY),
            new TestToken("setup", TinyCellLexer.SETUP),
            new TestToken("{", TinyCellLexer.LCURLY),
            new TestToken("}", TinyCellLexer.RCURLY),
            new TestToken("update", TinyCellLexer.UPDATE),
            new TestToken("{", TinyCellLexer.LCURLY),
            new TestToken("}", TinyCellLexer.RCURLY),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var funcDef = parser.functionDefinition();

        Assert.NotNull(funcDef);

        Assert.Equal(TinyCellParser.RULE_functionDefinition, funcDef.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the type rule")]
    public void ParserTypeRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("int", TinyCellLexer.INT),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var type = parser.type();

        Assert.NotNull(type);

        Assert.Equal(TinyCellParser.RULE_type, type.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the parameterList rule")]
    public void ParserParameterListRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("void", TinyCellLexer.VOID),
            new TestToken("myFunc", TinyCellLexer.Identifier),
            new TestToken("(", TinyCellLexer.LPAR),
            new TestToken("int", TinyCellLexer.INT),
            new TestToken("param1", TinyCellLexer.Identifier),
            new TestToken(",", TinyCellLexer.COMMA),
            new TestToken("int", TinyCellLexer.INT),
            new TestToken("param2", TinyCellLexer.Identifier),
            new TestToken(",", TinyCellLexer.COMMA),
            new TestToken("int", TinyCellLexer.INT),
            new TestToken("param3", TinyCellLexer.Identifier),
            new TestToken(")", TinyCellLexer.RPAR),
            new TestToken("{", TinyCellLexer.LCURLY),
            new TestToken("}", TinyCellLexer.RCURLY),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var paramList = parser.parameterList();

        Assert.NotNull(paramList);

        Assert.Equal(TinyCellParser.RULE_parameterList, paramList.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the parameter rule")]
    public void ParserParameterRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("void", TinyCellLexer.VOID),
            new TestToken("myFunc", TinyCellLexer.Identifier),
            new TestToken("(", TinyCellLexer.LPAR),
            new TestToken("int", TinyCellLexer.INT),
            new TestToken("param1", TinyCellLexer.Identifier),
            new TestToken(",", TinyCellLexer.COMMA),
            new TestToken("int", TinyCellLexer.INT),
            new TestToken("param2", TinyCellLexer.Identifier),
            new TestToken(",", TinyCellLexer.COMMA),
            new TestToken("int", TinyCellLexer.INT),
            new TestToken("param3", TinyCellLexer.Identifier),
            new TestToken(")", TinyCellLexer.RPAR),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var param = parser.parameter();

        Assert.NotNull(param);

        Assert.Equal(TinyCellParser.RULE_parameter, param.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the argumentList rule")]
    public void ParserArgumentListRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("myFunc", TinyCellLexer.Identifier),
            new TestToken("(", TinyCellLexer.LPAR),
            new TestToken("1", TinyCellLexer.IntNumeral),
            new TestToken(",", TinyCellLexer.COMMA),
            new TestToken("2", TinyCellLexer.IntNumeral),
            new TestToken(",", TinyCellLexer.COMMA),
            new TestToken("3", TinyCellLexer.IntNumeral),
            new TestToken(")", TinyCellLexer.RPAR),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var argList = parser.argumentList();

        Assert.NotNull(argList);

        Assert.Equal(TinyCellParser.RULE_argumentList, argList.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the argument rule")]
    public void ParserArgumentRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("myFunc", TinyCellLexer.Identifier),
            new TestToken("(", TinyCellLexer.LPAR),
            new TestToken("1", TinyCellLexer.IntNumeral),
            new TestToken(",", TinyCellLexer.COMMA),
            new TestToken("2", TinyCellLexer.IntNumeral),
            new TestToken(",", TinyCellLexer.COMMA),
            new TestToken("3", TinyCellLexer.IntNumeral),
            new TestToken(")", TinyCellLexer.RPAR),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var arg = parser.argument();

        Assert.NotNull(arg);

        Assert.Equal(TinyCellParser.RULE_argument, arg.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the declaration rule")]
    public void ParserDeclarationRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("int", TinyCellLexer.INT),
            new TestToken("myVar", TinyCellLexer.Identifier),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("setup", TinyCellLexer.SETUP),
            new TestToken("{", TinyCellLexer.LCURLY),
            new TestToken("}", TinyCellLexer.RCURLY),
            new TestToken("update", TinyCellLexer.UPDATE),
            new TestToken("{", TinyCellLexer.LCURLY),
            new TestToken("}", TinyCellLexer.RCURLY),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var decl = parser.declaration();

        Assert.NotNull(decl);

        Assert.Equal(TinyCellParser.RULE_declaration, decl.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the compoundStatement rule")]
    public void ParserCompoundStatementRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("{", TinyCellLexer.LCURLY),
            new TestToken("int", TinyCellLexer.INT),
            new TestToken("myVar", TinyCellLexer.Identifier),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("}", TinyCellLexer.RCURLY),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var compStmt = parser.compoundStatement();

        Assert.NotNull(compStmt);

        Assert.Equal(TinyCellParser.RULE_compoundStatement, compStmt.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the statement rule")]
    public void ParserStatementRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("int", TinyCellLexer.INT),
            new TestToken("myVar", TinyCellLexer.Identifier),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var stmt = parser.statement();

        Assert.NotNull(stmt);

        Assert.Equal(TinyCellParser.RULE_statement, stmt.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the ifStatement rule")]
    public void ParserIfStatementRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("if", TinyCellLexer.IF),
            new TestToken("(", TinyCellLexer.LPAR),
            new TestToken("true", TinyCellLexer.Bool),
            new TestToken(")", TinyCellLexer.RPAR),
            new TestToken("{", TinyCellLexer.LCURLY),
            new TestToken("}", TinyCellLexer.RCURLY),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var ifStmt = parser.ifStatement();

        Assert.NotNull(ifStmt);

        Assert.Equal(TinyCellParser.RULE_ifStatement, ifStmt.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the loopStatement rule")]
    public void ParserLoopStatementRule()
    {
        var whileTokens = new List<IToken>
        {
            new TestToken("while", TinyCellLexer.WHILE),
            new TestToken("(", TinyCellLexer.LPAR),
            new TestToken("true", TinyCellLexer.Bool),
            new TestToken(")", TinyCellLexer.RPAR),
            new TestToken("{", TinyCellLexer.LCURLY),
            new TestToken("}", TinyCellLexer.RCURLY),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(whileTokens);
        var loopStmt = parser.loopStatement();

        Assert.NotNull(loopStmt);

        Assert.Equal(TinyCellParser.RULE_loopStatement, loopStmt.RuleIndex);

        var forTokens = new List<IToken>
        {
            new TestToken("for", TinyCellLexer.FOR),
            new TestToken("(", TinyCellLexer.LPAR),
            new TestToken("int", TinyCellLexer.INT),
            new TestToken("i", TinyCellLexer.Identifier),
            new TestToken("=", TinyCellLexer.ASSIGN),
            new TestToken("0", TinyCellLexer.IntNumeral),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("i", TinyCellLexer.Identifier),
            new TestToken("<", TinyCellLexer.LT),
            new TestToken("10", TinyCellLexer.IntNumeral),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("i", TinyCellLexer.Identifier),
            new TestToken("++", TinyCellLexer.UNARYPLUS),
            new TestToken(")", TinyCellLexer.RPAR),
            new TestToken("{", TinyCellLexer.LCURLY),
            new TestToken("}", TinyCellLexer.RCURLY),
            new TestToken("", TinyCellLexer.Eof),
        };

        parser = CreateParserNoError(forTokens);
        loopStmt = parser.loopStatement();

        Assert.NotNull(loopStmt);

        Assert.Equal(TinyCellParser.RULE_loopStatement, loopStmt.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the jumpStatement rule")]
    public void ParserJumpStatementRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("return", TinyCellLexer.RETURN),
            new TestToken("2", TinyCellLexer.IntNumeral),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var jumpStmt = parser.jumpStatement();

        Assert.NotNull(jumpStmt);

        Assert.Equal(TinyCellParser.RULE_jumpStatement, jumpStmt.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the assignment rule")]
    public void ParserAssignmentRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("myVar", TinyCellLexer.Identifier),
            new TestToken("=", TinyCellLexer.ASSIGN),
            new TestToken("2", TinyCellLexer.IntNumeral),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var assign = parser.assignment();

        Assert.NotNull(assign);

        Assert.Equal(TinyCellParser.RULE_assignment, assign.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the functionCall rule")]
    public void ParserFunctionCallRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("myFunc", TinyCellLexer.Identifier),
            new TestToken("(", TinyCellLexer.LPAR),
            new TestToken("1", TinyCellLexer.IntNumeral),
            new TestToken(",", TinyCellLexer.COMMA),
            new TestToken("2", TinyCellLexer.IntNumeral),
            new TestToken(",", TinyCellLexer.COMMA),
            new TestToken("3", TinyCellLexer.IntNumeral),
            new TestToken(")", TinyCellLexer.RPAR),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var funcCall = parser.functionCall();

        Assert.NotNull(funcCall);

        Assert.Equal(TinyCellParser.RULE_functionCall, funcCall.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the primitiveExpression rule")]
    public void ParserPrimitiveExpressionRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("1", TinyCellLexer.IntNumeral),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var primExpr = parser.primitiveExpression();

        Assert.NotNull(primExpr);

        Assert.Equal(TinyCellParser.RULE_primitiveExpression, primExpr.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the unaryExpression rule")]
    public void ParserUnaryExpressionRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("1", TinyCellLexer.IntNumeral),
            new TestToken("--", TinyCellLexer.UNARYMINUS),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var unaryExpr = parser.unaryExpression();

        Assert.NotNull(unaryExpr);

        Assert.Equal(TinyCellParser.RULE_unaryExpression, unaryExpr.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the multiplicativeExpression rule")]
    public void ParserMultiplicativeExpressionRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("1", TinyCellLexer.IntNumeral),
            new TestToken("*", TinyCellLexer.MULT),
            new TestToken("2", TinyCellLexer.IntNumeral),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var multExpr = parser.multiplicativeExpression();

        Assert.NotNull(multExpr);

        Assert.Equal(TinyCellParser.RULE_multiplicativeExpression, multExpr.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the additiveExpression rule")]
    public void ParserAdditiveExpressionRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("1", TinyCellLexer.IntNumeral),
            new TestToken("+", TinyCellLexer.PLUS),
            new TestToken("2", TinyCellLexer.IntNumeral),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var addExpr = parser.additiveExpression();

        Assert.NotNull(addExpr);

        Assert.Equal(TinyCellParser.RULE_additiveExpression, addExpr.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the bitshiftExpression rule")]
    public void ParserBitshiftExpressionRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("1", TinyCellLexer.IntNumeral),
            new TestToken("<<", TinyCellLexer.BITSHIFTL),
            new TestToken("2", TinyCellLexer.IntNumeral),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var bitshiftExpr = parser.bitshiftExpression();

        Assert.NotNull(bitshiftExpr);

        Assert.Equal(TinyCellParser.RULE_bitshiftExpression, bitshiftExpr.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the comparisonExpression rule")]
    public void ParserComparisonExpressionRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("1", TinyCellLexer.IntNumeral),
            new TestToken("<", TinyCellLexer.LT),
            new TestToken("2", TinyCellLexer.IntNumeral),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var compExpr = parser.comparisonExpression();

        Assert.NotNull(compExpr);

        Assert.Equal(TinyCellParser.RULE_comparisonExpression, compExpr.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the equalityExpression rule")]
    public void ParserEqualityExpressionRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("1", TinyCellLexer.IntNumeral),
            new TestToken("==", TinyCellLexer.EQ),
            new TestToken("2", TinyCellLexer.IntNumeral),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var eqExpr = parser.equalityExpression();

        Assert.NotNull(eqExpr);

        Assert.Equal(TinyCellParser.RULE_equalityExpression, eqExpr.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the andExpression rule")]
    public void ParserAndExpressionRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("true", TinyCellLexer.Bool),
            new TestToken("&&", TinyCellLexer.AND),
            new TestToken("false", TinyCellLexer.Bool),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var andExpr = parser.andExpression();

        Assert.NotNull(andExpr);

        Assert.Equal(TinyCellParser.RULE_andExpression, andExpr.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the orExpression rule")]
    public void ParserOrExpressionRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("true", TinyCellLexer.Bool),
            new TestToken("||", TinyCellLexer.OR),
            new TestToken("false", TinyCellLexer.Bool),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var orExpr = parser.orExpression();

        Assert.NotNull(orExpr);

        Assert.Equal(TinyCellParser.RULE_orExpression, orExpr.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the ternaryExpression rule")]
    public void ParserTernaryExpressionRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("true", TinyCellLexer.Bool),
            new TestToken("?", TinyCellLexer.QUESTION),
            new TestToken("1", TinyCellLexer.IntNumeral),
            new TestToken(":", TinyCellLexer.COLON),
            new TestToken("2", TinyCellLexer.IntNumeral),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var ternExpr = parser.ternaryExpression();

        Assert.NotNull(ternExpr);

        Assert.Equal(TinyCellParser.RULE_ternaryExpression, ternExpr.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the expression rule")]
    public void ParserExpressionRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("true", TinyCellLexer.Bool),
            new TestToken("||", TinyCellLexer.OR),
            new TestToken("false", TinyCellLexer.Bool),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var expr = parser.expression();

        Assert.NotNull(expr);

        Assert.Equal(TinyCellParser.RULE_expression, expr.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the pinAssignmentExpression rule")]
    public void ParserPinAssignmentExpressionRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("write", TinyCellLexer.WRITE),
            new TestToken("HIGH", TinyCellLexer.VOLHIGH),
            new TestToken("to", TinyCellLexer.TO),
            new TestToken("myPin", TinyCellLexer.Identifier),
            new TestToken(";", TinyCellLexer.SEMI),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var pinAssignExpr = parser.pinAssignmentExpression();

        Assert.NotNull(pinAssignExpr);

        Assert.Equal(TinyCellParser.RULE_pinAssignmentExpression, pinAssignExpr.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the pinStatusExpression rule")]
    public void ParserPinStatusExpressionRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("read", TinyCellLexer.READ),
            new TestToken("tester", TinyCellLexer.Identifier),
            new TestToken("to", TinyCellLexer.TO),
            new TestToken("testerer", TinyCellLexer.Identifier),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var pinStatExpr = parser.pinStatusExpression();

        Assert.NotNull(pinStatExpr);

        Assert.Equal(TinyCellParser.RULE_pinStatusExpression, pinStatExpr.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the identifier rule")]
    public void ParserIdentifierRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("myVar", TinyCellLexer.Identifier),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var id = parser.identifier();

        Assert.NotNull(id);

        Assert.Equal(TinyCellParser.RULE_identifier, id.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the assignmentOperator rule")]
    public void ParserAssignmentOperatorRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("=", TinyCellLexer.ASSIGN),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var assignOp = parser.assignmentOperator();

        Assert.NotNull(assignOp);

        Assert.Equal(TinyCellParser.RULE_assignmentOperator, assignOp.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the pinVoltage rule")]
    public void ParserPinVoltageRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("HIGH", TinyCellLexer.VOLHIGH),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var pinVolt = parser.pinVoltage();

        Assert.NotNull(pinVolt);

        Assert.Equal(TinyCellParser.RULE_pinVoltage, pinVolt.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the pinStatus rule")]
    public void ParserPinStatusRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("INPUT", TinyCellLexer.PININ),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var pinStat = parser.pinStatus();

        Assert.NotNull(pinStat);

        Assert.Equal(TinyCellParser.RULE_pinStatus, pinStat.RuleIndex);
    }

    [Fact]
    [Description("Can parse based on the arrayContent rule")]
    public void ParserArrayContentRule()
    {
        var tokens = new List<IToken>
        {
            new TestToken("1", TinyCellLexer.IntNumeral),
            new TestToken(",", TinyCellLexer.COMMA),
            new TestToken("2", TinyCellLexer.IntNumeral),
            new TestToken("", TinyCellLexer.Eof),
        };

        var parser = CreateParserNoError(tokens);
        var arrayContent = parser.arrayContent();

        Assert.NotNull(arrayContent);

        Assert.Equal(TinyCellParser.RULE_arrayContent, arrayContent.RuleIndex);
    }
}