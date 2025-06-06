using System.Drawing;
using VTA.API.Models;

namespace VTA.API.DTOs;

/// <summary>
/// This class contains all the functions we use to convert a PostDTO to a model, and model to GetDTO it's pretty self explanatory what they do
/// </summary>
public static class DTOConverter
{
    public static ArtefactGetDTO MapArtefactToArtefactGetDTO(Artefact artefact, string scheme, string host)
    {
        return new ArtefactGetDTO
        {
            ArtefactId = artefact.ArtefactId,
            ArtefactIndex = artefact.ArtefactIndex,
            UserId = artefact.UserId,
            CategoryId = artefact.CategoryId,
            Name = artefact.Name,
            ImageUrl = scheme + "://" + host + artefact.ImagePath
        };
    }

    public static Artefact MapArtefactPostDTOToArtefact(ArtefactPostDTO artefact, string id, string? imageUrl)
    {
        return new Artefact
        {
            ArtefactId = id,
            ArtefactIndex = artefact.ArtefactIndex,
            UserId = artefact.UserId,
            CategoryId = artefact.CategoryId,
            Name = artefact.Name,
            ImagePath = imageUrl
        };
    }

    public static CategoryGetDTO MapCategoryToCategoryGetDTO(Category category, string scheme, string host)
    {
        ICollection<ArtefactGetDTO> artefacts = new List<ArtefactGetDTO>();
        foreach (Artefact artefact in category.Artefacts)
        {
            artefacts.Add(MapArtefactToArtefactGetDTO(artefact, scheme, host));
        }
        return new CategoryGetDTO
        {
            CategoryId = category.CategoryId,
            CategoryIndex = category.CategoryIndex,
            Name = category.Name,
            Artefacts = artefacts,
            ImageUrl = scheme + "://" + host + category.ImagePath
        };
    }

    public static Category MapCategoryPostDTOToCategory(CategoryPostDTO category, string id, string imageUrl)
    {
        return new Category
        {
            CategoryId = id,
            CategoryIndex = category.CategoryIndex,
            UserId = category.UserId,
            Name = category.Name,
            ImagePath = imageUrl
        };
    }
    public static UserGetDTO MapUserToUserGetDTO(User user)
    {
        return new UserGetDTO
        {
            Id = user.Id,
            Name = user.Name,
            GuardianKey = user.GuardianKey,
            Username = user.Username
        };
    }

    public static User MapUserSignUpDTOToUser(UserSignupDTO dto, string id)
    {
        return new User
        {
            Id = id,
            Name = dto.Name,
            Password = dto.Password,
            Username = dto.Username,
            GuardianKey = dto.GuardianKey
        };
    }
    public static User MapUserPostDTOToUser(UserPostDTO user, string id)
    {
        return new User
        {
            Id = id,
            Name = user.Name,
            Password = user.Password,
            GuardianKey = user.GuardianKey,
            Username = user.Username
        };
    }

}