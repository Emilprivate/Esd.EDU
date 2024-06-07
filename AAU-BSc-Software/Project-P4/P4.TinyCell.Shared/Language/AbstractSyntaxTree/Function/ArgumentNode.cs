namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.Function;

public class ArgumentNode : AstNode
{
    public AstNode Node { get; set; }

    public ArgumentNode(AstNode node)
    {
        Node = node;
        AddChild(Node);
    }

    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitArgumentNode(this);
    }
}