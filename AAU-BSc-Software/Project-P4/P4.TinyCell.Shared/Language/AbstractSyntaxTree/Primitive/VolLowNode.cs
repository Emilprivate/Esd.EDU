namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.Primitive;

public class VolLowNode : VoltageNode
{
    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitVolLowNode(this);
    }
}