namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.Array;

public class ArrayElementsNode : AstNode
{
    public AstNode[] Elements { get; set; }

    public ArrayElementsNode(AstNode[] elements)
    {
        Elements = elements;
        foreach (var element in elements)
        {
            AddChild(element);
        }
    }

    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitArrayElementsNode(this);
    }
}