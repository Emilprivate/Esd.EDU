namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree;

public class RootNode : AstNode
{
    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitRootNode(this);
    }
}