namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.Primitive;

public class VolHighNode : VoltageNode
{
    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitVolHighNode(this);
    }
}