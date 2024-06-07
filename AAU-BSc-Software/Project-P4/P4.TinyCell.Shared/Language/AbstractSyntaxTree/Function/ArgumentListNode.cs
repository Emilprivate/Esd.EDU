namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.Function;

public class ArgumentListNode : AstNode
{
    public ArgumentNode[] Arguments { get; }

    public ArgumentListNode(ArgumentNode[] arguments)
    {
        Arguments = arguments;

        foreach (ArgumentNode argument in arguments)
        {
            AddChild(argument);
        }
    }

    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitArgumentListNode(this);
    }
}