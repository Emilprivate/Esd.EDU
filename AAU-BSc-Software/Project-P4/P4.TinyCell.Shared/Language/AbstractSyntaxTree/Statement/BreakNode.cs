namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.Statement;

public class BreakNode : AstNode
{
    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitBreakNode(this);
    }
}