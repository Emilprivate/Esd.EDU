namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree;

public abstract class AstNode
{
    public List<AstNode> Children { get; set; } = [];

    public AstNode()
    {
        Children = [];
    }

    public abstract T Accept<T>(IAstVisitor<T> visitor);

    public override string ToString()
    {
        return ToString(0);
    }

    public virtual string ToString(int indentation)
    {
        var indent = new string(' ', indentation * 2);
        string str = $"{indent}{GetType().Name}";

        foreach (AstNode child in Children.Where(s => s is not null))
        {
            str += $"\n{child.ToString(indentation + 1)}";
        }

        return str;
    }

    public void AddChild(AstNode node)
    {
        Children.Add(node);
    }
}