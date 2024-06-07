using System.ComponentModel;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Expression;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Function;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.ParameterNodes;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Primitive;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Statement;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Types;

namespace P4.TinyCell.Tests.UnitTests.AbstractSyntaxTree;

public class AbstractSyntaxTreeStructures
{
    [Fact]
    [Description("Can create and manipulate a simple AST node")]
    public void ASTCreateSimpleASTNode()
    {
        var intNode = new IntNode(5);
        var rootNode = new RootNode();
        rootNode.AddChild(intNode);

        Assert.Single(rootNode.Children);
        Assert.Equal(5, ((IntNode)rootNode.Children[0]).Value);
    }

    [Fact]
    [Description("Can create a nested AST structure")]
    public void ASTCreateNestedASTStructure()
    {
        var rootNode = new RootNode();

        var typeNode = new TypeNode(TcType.INT);
        var identifierNode = new IdentifierNode("testFunc");

        var parameterNode = new ParameterNode(new TypeNode(TcType.INT), new IdentifierNode("a"));
        var parameterListNode = new ParameterListNode(new[] { parameterNode });

        var returnNode = new ReturnNode(new IntNode(42));
        var statementCollectionNode = new StatementCollectionNode(new AstNode[] { returnNode });

        var funcNode = new FunctionDefinitionNode(typeNode, identifierNode, parameterListNode, statementCollectionNode);

        rootNode.AddChild(funcNode);

        Assert.Single(rootNode.Children);
        Assert.Single(funcNode.CompoundStatement.Statements);
        Assert.Equal("testFunc", ((FunctionDefinitionNode)rootNode.Children[0]).Identifier.Value);
        Assert.Equal(42, ((IntNode)((ReturnNode)funcNode.CompoundStatement.Statements[0]).Children[0]).Value);
    }

    [Fact]
    [Description("Can create a nested AST structure with multiple statements")]
    public void ASTCreateNestedASTStructureWithMultipleStatements()
    {
        var rootNode = new RootNode();

        var typeNode = new TypeNode(TcType.INT);
        var identifierNode = new IdentifierNode("testFunc");

        var parameterNode = new ParameterNode(new TypeNode(TcType.INT), new IdentifierNode("a"));
        var parameterListNode = new ParameterListNode(new[] { parameterNode });

        var declarationNode = new DeclarationNode(new TypeNode(TcType.INT), new IdentifierNode("b"), new IntNode(5));
        var returnNode = new ReturnNode(new IntNode(42));
        var statementCollectionNode = new StatementCollectionNode(new AstNode[] { declarationNode, returnNode });

        var funcNode = new FunctionDefinitionNode(typeNode, identifierNode, parameterListNode, statementCollectionNode);

        rootNode.AddChild(funcNode);

        Assert.Single(rootNode.Children);
        Assert.Equal(2, funcNode.CompoundStatement.Count);
        Assert.Equal("testFunc", ((FunctionDefinitionNode)rootNode.Children[0]).Identifier.Value);

        var intNode = (IntNode)declarationNode.Children.FirstOrDefault(node => node is IntNode);
        Assert.NotNull(intNode);
        Assert.Equal(5, intNode.Value);

        Assert.Equal(42, ((IntNode)((ReturnNode)funcNode.CompoundStatement.Statements[1]).Children[0]).Value);
    }
}