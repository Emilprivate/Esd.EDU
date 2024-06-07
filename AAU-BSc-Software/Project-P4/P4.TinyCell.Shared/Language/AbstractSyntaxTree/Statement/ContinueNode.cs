namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.Statement;

public class ContinueNode : AstNode
{
    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitContinueNode(this);
    }
}