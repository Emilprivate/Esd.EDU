namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.Primitive;

public class VoidNode() : PrimitveExprNode<object>(TcType.VOID)
{
    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitVoidNode(this);
    }
}