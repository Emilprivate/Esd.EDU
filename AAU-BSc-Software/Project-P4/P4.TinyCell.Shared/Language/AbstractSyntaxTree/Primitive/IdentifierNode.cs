namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.Primitive;

public class IdentifierNode(string value) : AstNode
{
    public string Value { get; set; } = value;

    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitIdentifierNode(this);
    }
}