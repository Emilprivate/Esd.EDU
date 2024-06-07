using P4.TinyCell.Shared.Language.AbstractSyntaxTree.NumExpr;

namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree;

public class TestAstVisitor : AstBaseVisitor<AstNode>
{
    public override AstNode VisitRootNode(RootNode rootNode)
    {
        RootNode document = new();
        foreach (var child in rootNode.Children)
        {
            AstNode childNode = Visit(child);
            document.AddChild(childNode);
        }

        return document;
    }

    public override AstNode Visit(AstNode node)
    {
#if DEBUG
        Console.WriteLine($"Visiting node: {node.GetType().Name}");
#endif
        return base.Visit(node);
    }

    public override AstNode VisitAddExprNode(AddExprNode addExprNode)
    {
        return addExprNode;
    }
}