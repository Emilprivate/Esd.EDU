namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.Primitive;

public class FloatNode(float value) : PrimitveExprNode<float>(value, TcType.FLOAT)
{
    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitFloatNode(this);
    }
}