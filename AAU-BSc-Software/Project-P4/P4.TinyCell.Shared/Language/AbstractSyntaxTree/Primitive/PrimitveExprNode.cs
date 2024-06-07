namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.Primitive;

public abstract class PrimitveExprNode<T> : AstNode
{
    public T? Value { get; set; }
    public TcType Type { get; set; }

    public PrimitveExprNode(T value)
    {
        Value = value;
    }

    public PrimitveExprNode(TcType type)
    {
        Type = type;
    }

    public PrimitveExprNode(T value, TcType type)
    {
        Value = value;
        Type = type;
    }
}