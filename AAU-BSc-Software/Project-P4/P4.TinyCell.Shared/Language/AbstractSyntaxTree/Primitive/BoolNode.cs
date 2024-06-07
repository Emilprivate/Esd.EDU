namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.Primitive;

public class BoolNode(bool value) : PrimitveExprNode<bool>(value, TcType.BOOL)
{
    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitBoolNode(this);
    }
}