using System.ComponentModel;
using Antlr4.Runtime;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Expression;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Function;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.NumExpr;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.ParameterNodes;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.PinExpr;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Primitive;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Statement;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Types;

namespace P4.TinyCell.Tests.UnitTests.AbstractSyntaxTree;

public class AbstractSyntaxTreeBuilder
{
    [Fact]
    [Description(
        "Verifies that the AstBuilderVisitor correctly visits and constructs an AddExprNode from an additive expression")]
    public void VisitAddExprNode()
    {
        var input = "1 + 2";
        var parser = new TinyCellParser(new CommonTokenStream(new TinyCellLexer(new AntlrInputStream(input))));
        var visitor = new AstBuilderVisitor();

        var result = visitor.VisitAdditiveExpression(parser.additiveExpression());

        Assert.IsType<AddExprNode>(result);

        var addExprNode = (AddExprNode)result;

        Assert.IsType<IntNode>(addExprNode.Left);
        Assert.IsType<IntNode>(addExprNode.Right);
        Assert.Equal(1, ((IntNode)addExprNode.Left).Value);
        Assert.Equal(2, ((IntNode)addExprNode.Right).Value);
    }

    [Fact]
    [Description(
        "Verifies that the AstBuilderVisitor correctly visits and constructs a SubExprNode from a subtraction expression")]
    public void VisitSubExprNode()
    {
        var input = "1 - 2";
        var parser = new TinyCellParser(new CommonTokenStream(new TinyCellLexer(new AntlrInputStream(input))));
        var visitor = new AstBuilderVisitor();

        var result = visitor.VisitAdditiveExpression(parser.additiveExpression());

        Assert.IsType<SubExprNode>(result);

        var subExprNode = (SubExprNode)result;

        Assert.IsType<IntNode>(subExprNode.Left);
        Assert.IsType<IntNode>(subExprNode.Right);
        Assert.Equal(1, ((IntNode)subExprNode.Left).Value);
        Assert.Equal(2, ((IntNode)subExprNode.Right).Value);
    }

    [Fact]
    [Description(
        "Verifies that the AstBuilderVisitor correctly visits and constructs a AndExprNode from an and expression")]
    public void VisitAndExprNode()
    {
        var input = "true && false";
        var parser = new TinyCellParser(new CommonTokenStream(new TinyCellLexer(new AntlrInputStream(input))));
        var visitor = new AstBuilderVisitor();

        var result = visitor.VisitAndExpression(parser.andExpression());

        Assert.IsType<AndExprNode>(result);

        var andExprNode = (AndExprNode)result;

        Assert.IsType<BoolNode>(andExprNode.Left);
        Assert.IsType<BoolNode>(andExprNode.Right);
        Assert.True(((BoolNode)andExprNode.Left).Value);
        Assert.False(((BoolNode)andExprNode.Right).Value);
    }

    [Fact]
    [Description(
        "Verifies that the AstBuilderVisitor correctly visits and constructs a OrExprNode from an or expression")]
    public void VisitOrExprNode()
    {
        var input = "true || false";
        var parser = new TinyCellParser(new CommonTokenStream(new TinyCellLexer(new AntlrInputStream(input))));
        var visitor = new AstBuilderVisitor();

        var result = visitor.VisitOrExpression(parser.orExpression());

        Assert.IsType<OrExprNode>(result);

        var orExprNode = (OrExprNode)result;

        Assert.IsType<BoolNode>(orExprNode.Left);
        Assert.IsType<BoolNode>(orExprNode.Right);
        Assert.True(((BoolNode)orExprNode.Left).Value);
        Assert.False(((BoolNode)orExprNode.Right).Value);
    }

    [Fact]
    [Description(
        "Verifies that the AstBuilderVisitor correctly visits and constructs a DivExprNode from a division expression")]
    public void VisitDivExprNode()
    {
        var input = "10 / 2";
        var parser = new TinyCellParser(new CommonTokenStream(new TinyCellLexer(new AntlrInputStream(input))));
        var visitor = new AstBuilderVisitor();

        var result = visitor.VisitMultiplicativeExpression(parser.multiplicativeExpression());

        Assert.IsType<DivExprNode>(result);

        var divExprNode = (DivExprNode)result;

        Assert.IsType<IntNode>(divExprNode.Left);
        Assert.IsType<IntNode>(divExprNode.Right);
        Assert.Equal(10, ((IntNode)divExprNode.Left).Value);
        Assert.Equal(2, ((IntNode)divExprNode.Right).Value);
    }

    [Fact]
    [Description(
        "Verifies that the AstBuilderVisitor correctly visits and constructs a ModExprNode from a modulo expression")]
    public void VisitModExprNode()
    {
        var input = "10 % 3";
        var parser = new TinyCellParser(new CommonTokenStream(new TinyCellLexer(new AntlrInputStream(input))));
        var visitor = new AstBuilderVisitor();

        var result = visitor.VisitMultiplicativeExpression(parser.multiplicativeExpression());

        Assert.IsType<ModExprNode>(result);

        var modExprNode = (ModExprNode)result;

        Assert.IsType<IntNode>(modExprNode.Left);
        Assert.IsType<IntNode>(modExprNode.Right);
        Assert.Equal(10, ((IntNode)modExprNode.Left).Value);
        Assert.Equal(3, ((IntNode)modExprNode.Right).Value);
    }

    [Fact]
    [Description(
        "Verifies that the AstBuilderVisitor correctly visits and constructs a MultExprNode from a multiplication expression")]
    public void VisitMultExprNode()
    {
        var input = "10 * 2";
        var parser = new TinyCellParser(new CommonTokenStream(new TinyCellLexer(new AntlrInputStream(input))));
        var visitor = new AstBuilderVisitor();

        var result = visitor.VisitMultiplicativeExpression(parser.multiplicativeExpression());

        Assert.IsType<MultExprNode>(result);

        var multExprNode = (MultExprNode)result;

        Assert.IsType<IntNode>(multExprNode.Left);
        Assert.IsType<IntNode>(multExprNode.Right);
        Assert.Equal(10, ((IntNode)multExprNode.Left).Value);
        Assert.Equal(2, ((IntNode)multExprNode.Right).Value);
    }

    [Fact]
    [Description(
        "Verifies that the AstBuilderVisitor correctly visits and constructs a FunctionDefinitionNode from a function definition")]
    public void VisitFunctionDefinition()
    {
        var input = "int add(int a, int b) { return a + b; }";
        var parser = new TinyCellParser(new CommonTokenStream(new TinyCellLexer(new AntlrInputStream(input))));
        var visitor = new AstBuilderVisitor();

        var result = visitor.VisitFunctionDefinition(parser.functionDefinition());

        Assert.IsType<FunctionDefinitionNode>(result);

        var funcDefNode = (FunctionDefinitionNode)result;

        Assert.Equal("add", funcDefNode.Identifier.Value);
        Assert.Equal(TcType.INT, funcDefNode.Type.Type);
        Assert.Equal(2, funcDefNode.ParameterList.Parameters.Length);
        Assert.Single(funcDefNode.CompoundStatement.Statements);
        Assert.IsType<ReturnNode>(funcDefNode.CompoundStatement.Statements[0]);
    }

    [Fact]
    [Description(
        "Verifies that the AstBuilderVisitor correctly visits and constructs a DeclarationNode from a declaration")]
    public void VisitDeclaration()
    {
        var input = "int x = 5;";
        var parser = new TinyCellParser(new CommonTokenStream(new TinyCellLexer(new AntlrInputStream(input))));
        var visitor = new AstBuilderVisitor();

        var result = visitor.VisitDeclaration(parser.declaration());

        Assert.IsType<DeclarationNode>(result);

        var declarationNode = (DeclarationNode)result;

        Assert.Equal("x", declarationNode.Identifier.Value);
        Assert.Equal(TcType.INT, declarationNode.Type.Type);
        Assert.IsType<TypeNode>(declarationNode.Type);
    }

    [Fact]
    [Description(
        "Verifies that the AstBuilderVisitor correctly visits and constructs a ParameterListNode from a parameter list")]
    public void VisitParameterList()
    {
        var input = "int a, int b";
        var parser = new TinyCellParser(new CommonTokenStream(new TinyCellLexer(new AntlrInputStream(input))));
        var visitor = new AstBuilderVisitor();

        var result = visitor.VisitParameterList(parser.parameterList());

        Assert.IsType<ParameterListNode>(result);

        var parameterListNode = (ParameterListNode)result;

        Assert.Equal(2, parameterListNode.Parameters.Length);
        Assert.Equal("a", parameterListNode.Parameters[0].Identifier.Value);
        Assert.Equal("b", parameterListNode.Parameters[1].Identifier.Value);
    }

    [Fact]
    [Description(
        "Verifies that the AstBuilderVisitor correctly visits and constructs a ParameterNode from a parameter")]
    public void VisitParameter()
    {
        var input = "int a";
        var parser = new TinyCellParser(new CommonTokenStream(new TinyCellLexer(new AntlrInputStream(input))));
        var visitor = new AstBuilderVisitor();

        var result = visitor.VisitParameter(parser.parameter());

        Assert.IsType<ParameterNode>(result);

        var parameterNode = (ParameterNode)result;

        Assert.Equal("a", parameterNode.Identifier.Value);
        Assert.Equal(TcType.INT, parameterNode.TypeNode.Type);
        Assert.IsType<TcType>(parameterNode.TypeNode.Type);
        Assert.IsType<TypeNode>(parameterNode.TypeNode);
    }
}