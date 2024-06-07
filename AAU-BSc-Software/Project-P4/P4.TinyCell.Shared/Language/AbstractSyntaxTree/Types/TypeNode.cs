namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.Types;

public class TypeNode(TcType type) : AstNode
{
    public TcType Type { get; set; } = type;

    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitTypeNode(this);
    }

    public override string ToString()
    {
        return ToString(0);
    }

    public override string ToString(int indentation)
    {
        var indent = new string(' ', indentation * 2);
        string str = $"{indent}{Type}";

        foreach (AstNode child in Children.Where(s => s is not null))
        {
            str += $"\n{child.ToString(indentation + 1)}";
        }

        return str;
    }
}